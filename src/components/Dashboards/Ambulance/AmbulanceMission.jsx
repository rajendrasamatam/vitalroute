import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { MapPin, Navigation, Clock, AlertTriangle, Activity } from 'lucide-react';
import { database, db } from '../../../firebase';
import { ref, set, onDisconnect } from 'firebase/database';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import './AmbulanceMission.css';

// Libraries for Google Maps
const libraries = ['places'];

// Distance Calc Helper
const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth's radius in meters

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const AmbulanceMission = ({ userProfile }) => {
    // SECURITY WARNING: In production, restrict this key to specific domains
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [currentLocation, setCurrentLocation] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [locationError, setLocationError] = useState(null);
    const [hospitalFetchStatus, setHospitalFetchStatus] = useState('loading');
    const [activeRoute, setActiveRoute] = useState(() => {
        const saved = localStorage.getItem('activeRoute');
        return saved ? JSON.parse(saved) : null;
    });

    const [signals, setSignals] = useState([]);
    const lastTriggeredSignalRef = useRef(null);

    useEffect(() => {
        if (activeRoute) {
            localStorage.setItem('activeRoute', JSON.stringify(activeRoute));
        } else {
            localStorage.removeItem('activeRoute');
        }
    }, [activeRoute]);

    // FETCH SIGNALS ON MOUNT FOR GEOFENCING
    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const snap = await getDocs(collection(db, 'signals'));
                const sigs = [];
                snap.forEach(d => {
                    const data = d.data();
                    if (data.geofence) sigs.push({ id: d.id, ...data });
                });
                setSignals(sigs);
            } catch (err) {
                console.error("Error fetching signals for geofence", err);
            }
        };
        fetchSignals();
    }, []);

    const isPointInPolygon = (pointLat, pointLng, polygon) => {
        if (!polygon || polygon.length < 3) return false;
        let isInside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lat, yi = polygon[i].lng;
            const xj = polygon[j].lat, yj = polygon[j].lng;
            const intersect = ((yi > pointLng) !== (yj > pointLng)) &&
                (pointLat < (xj - xi) * (pointLng - yi) / (yj - yi) + xi);
            if (intersect) isInside = !isInside;
        }
        return isInside;
    };

    // Sync location to Firestore throttler
    const lastSyncedLocation = useRef(null);

    // 1. LOCATION TRACKING
    useEffect(() => {
        let watchId = null;
        const DISTANCE_THRESHOLD_METERS = 10; // High precision for RTDB
        const SYNC_THRESHOLD_METERS = 10;

        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 60000,
            };

            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    setLastUpdate(new Date());
                    setCurrentLocation(newLocation);
                    setLocationError(null);

                    if (userProfile?.uid) {
                        // Just update local ref for other effects to use
                        lastSyncedLocation.current = newLocation;
                    }
                },
                (error) => {
                    let msg = error.message;
                    if (error.code === error.TIMEOUT) msg = "GPS Timeout";
                    if (error.code === error.PERMISSION_DENIED) msg = "GPS Denied";
                    setLocationError(msg);
                },
                options
            );
        } else {
            setLocationError("Geolocation not supported");
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [userProfile]);

    // 2. ACTIVE MISSION TRACKING LOOP (Strict 2s Interval)
    useEffect(() => {
        let intervalId = null;

        if (activeRoute && currentLocation && userProfile?.uid) {
            // Immediate update
            const updateLocation = async () => {
                try {
                    const locRef = ref(database, `ambulances/${userProfile.uid}/location`);
                    set(locRef, {
                        lat: currentLocation.lat,
                        lng: currentLocation.lng,
                        timestamp: Date.now(),
                        status: 'on_mission',
                        destination: activeRoute.name,
                        destLat: activeRoute.lat,
                        destLng: activeRoute.lng,
                        type: userProfile?.role || 'ambulance'
                    });
                    onDisconnect(locRef).remove();

                    // Check for Arrival
                    const distToDest = haversineDistance(currentLocation, activeRoute);
                    if (distToDest < 50) { // 50 meters arrival threshold
                        setActiveRoute(null); // End mission
                        alert("You have arrived at the destination.");
                    }

                    // --- GEOFENCE TRIGGER LOGIC ---
                    if (signals.length > 0) {
                        let triggeredSignalId = null;
                        let targetJunctionId = null;

                        for (const sig of signals) {
                            if (sig.geofence?.type === 'polygon' && sig.geofence.coordinates) {
                                if (isPointInPolygon(currentLocation.lat, currentLocation.lng, sig.geofence.coordinates)) {
                                    triggeredSignalId = sig.id;
                                    targetJunctionId = sig.junctionId;
                                    break;
                                }
                            } else if (sig.geofence?.type === 'circle' && sig.geofence.center && sig.geofence.radius) {
                                const dist = haversineDistance(currentLocation, sig.geofence.center);
                                if (dist <= sig.geofence.radius) {
                                    triggeredSignalId = sig.id;
                                    targetJunctionId = sig.junctionId;
                                    break;
                                }
                            }
                        }

                        // Update Firestore if we entered a new zone
                        if (triggeredSignalId && lastTriggeredSignalRef.current !== triggeredSignalId) {
                            lastTriggeredSignalRef.current = triggeredSignalId;
                            try {
                                const junctionSignals = signals.filter(s => s.junctionId === targetJunctionId);
                                const batch = writeBatch(db);
                                junctionSignals.forEach(s => {
                                    const sRef = doc(db, "signals", s.id);
                                    if (s.id === triggeredSignalId) {
                                        batch.update(sRef, { state: 'green', emergencyOverride: true });
                                    } else {
                                        batch.update(sRef, { state: 'red', emergencyOverride: true });
                                    }
                                });
                                await batch.commit();
                                console.log("Geofence override applied for signal:", triggeredSignalId);
                            } catch (err) {
                                console.error("Geofence override failed", err);
                            }
                        } else if (!triggeredSignalId) {
                            // Left all zones
                            lastTriggeredSignalRef.current = null;
                        }
                    }
                    // ------------------------------

                } catch (e) {
                    console.error("Tracking sync failed", e);
                }
            };

            // Run once immediately
            updateLocation();

            // Run every 2 seconds
            intervalId = setInterval(updateLocation, 2000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [activeRoute, currentLocation, userProfile, signals]);

    // 2. FETCH HOSPITALS
    useEffect(() => {
        if (!currentLocation || !isLoaded) return;

        setHospitalFetchStatus('loading');
        // Use a dummy div for the service (headless)
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        const request = {
            location: currentLocation,
            radius: 10000, // 10km
            type: 'hospital',
            keyword: 'emergency'
        };

        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const hospitals = results
                    .map(place => {
                        const placeLoc = {
                            lat: place.geometry?.location?.lat(),
                            lng: place.geometry?.location?.lng()
                        };
                        const distMeters = haversineDistance(currentLocation, placeLoc);
                        return {
                            id: place.place_id,
                            name: place.name,
                            lat: placeLoc.lat,
                            lng: placeLoc.lng,
                            address: place.vicinity || 'Address unavailable',
                            rating: place.rating,
                            distance: distMeters
                        };
                    })
                    .filter(h => h.distance <= 10000) // Strict 10km filter
                    .sort((a, b) => a.distance - b.distance) // Nearest first
                    .map((h, index) => ({ ...h, rank: index + 1 }))
                    .slice(0, 10);

                setNearbyHospitals(hospitals);
                setHospitalFetchStatus(hospitals.length > 0 ? 'success' : 'empty');
            } else {
                setNearbyHospitals([]);
                setHospitalFetchStatus('error');
            }
        });
    }, [currentLocation, isLoaded]);

    const handleNavigate = (hospital) => {
        if (currentLocation) {
            setActiveRoute(hospital);
            const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    const handleReachedDestination = async () => {
        if (!activeRoute) return;
        const confirmEnd = window.confirm("Confirm arrival at destination?");
        if (!confirmEnd) return;

        try {
            if (userProfile?.uid && currentLocation) {
                const locRef = ref(database, `ambulances/${userProfile.uid}/location`);
                await set(locRef, {
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    timestamp: Date.now(),
                    status: 'available',
                    type: userProfile?.role || 'ambulance'
                });
            }
        } catch (e) {
            console.error("Error updating status", e);
        }

        setActiveRoute(null);
    };

    if (loadError) return <div className="error-screen">Map Load Error</div>;
    if (!isLoaded) return <div className="loading-screen">Loading Core Systems...</div>;

    return (
        <div className="ambulance-mission-container">
            {/* ALERT BANNER REMOVED */}

            {/* QUICK STATS */}
            <div className="mission-grid">
                <div className="mission-card">
                    <div className="card-icon blue"><MapPin size={24} /></div>
                    <div className="card-content">

                        <div className="card-value">
                            {currentLocation
                                ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                                : <span className="blink">Acquiring...</span>}
                        </div>
                        <div className="value-sub">GPS Signal Strong</div>
                    </div>
                </div>

                <div className="mission-card">
                    <div className="card-icon green"><Navigation size={28} /></div>
                    <div className="card-content">

                        <div className="card-value hospital-name-value" style={{ color: activeRoute ? '#10b981' : 'inherit' }}>
                            {activeRoute ? activeRoute.name : "None"}
                        </div>
                        <div className="value-sub">
                            {activeRoute ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                                    <span>Navigation in progress</span>
                                    <button
                                        onClick={handleReachedDestination}
                                        style={{
                                            background: '#10b981',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <Activity size={14} /> ARRIVED
                                    </button>
                                </div>
                            ) : "Standby for mission"}
                        </div>
                    </div>
                </div>

                <div className="mission-card">
                    <div className="card-icon orange"><Clock size={24} /></div>
                    <div className="card-content">

                        <div className="card-value">
                            {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
                        </div>
                        <div className="value-sub">Real-time Link Active</div>
                    </div>
                </div>
            </div>

            {/* HOSPITAL LIST */}
            <div className="hospitals-section">
                <div className="section-header">
                    <AlertTriangle size={24} color="#e74c3c" />
                    <span className="section-title">Emergency Route Selection</span>
                </div>

                <div className="hospital-list">
                    {hospitalFetchStatus === 'loading' && <div className="p-4 text-gray-400">Scanning sector for medical facilities...</div>}
                    {hospitalFetchStatus === 'empty' && <div className="p-4 text-gray-400">No emergency hospitals found in 10km radius.</div>}

                    {nearbyHospitals.map(h => (
                        <div key={h.id} className="hospital-item">
                            <div className="rank-badge">{h.rank}</div>
                            <div className="h-info">
                                <div className="h-name">{h.name}</div>
                                <div className="h-addr">{h.address}</div>
                                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: '4px' }}>
                                    {(h.distance / 1000).toFixed(1)} km away
                                </div>
                            </div>
                            <button
                                onClick={() => handleNavigate(h)}
                                className="nav-btn"
                            >
                                <Navigation size={16} /> NAVIGATE
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AmbulanceMission;
