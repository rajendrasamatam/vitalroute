import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoadScript, GoogleMap, Marker, Polyline, Circle, InfoWindow } from '@react-google-maps/api';
import { database } from '../../../firebase';
import { ref, onValue } from 'firebase/database';

const defaultCenter = {
    lat: 17.3850,
    lng: 78.4867
};

const libraries = ['places'];

// Google Maps Dark Mode Style
const darkModeStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: darkModeStyle,
    clickableIcons: false,
    gestureHandling: "greedy" // Allow scroll zoom without Ctrl key
};

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
};


const AdminLiveMap = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [ambulances, setAmbulances] = useState([]);
    const [routePolylines, setRoutePolylines] = useState({}); // { [ambulanceId]: [ {lat,lng}, ... ] }
    const [selectedAmbulance, setSelectedAmbulance] = useState(null);

    const mapRef = useRef(null);
    const handleMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // 1. Listen to Realtime Database
    useEffect(() => {
        const ambulancesRef = ref(database, 'ambulances');
        const unsubscribe = onValue(ambulancesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const activeUnits = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    ...data[key].location,
                    // Ensure lat/lng are numbers
                    lat: Number(data[key].location.lat),
                    lng: Number(data[key].location.lng),
                    destLat: data[key].location.destLat ? Number(data[key].location.destLat) : null,
                    destLng: data[key].location.destLng ? Number(data[key].location.destLng) : null
                }));
                setAmbulances(activeUnits);
            } else {
                setAmbulances([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Exact Routes (OSRM)
    useEffect(() => {
        ambulances.forEach(async (amb) => {
            if (amb.status === 'on_mission' && amb.destLat && amb.destLng) {
                // Avoid flooding API
                if (!routePolylines[amb.id]) {
                    try {
                        const response = await fetch(
                            `https://router.project-osrm.org/route/v1/driving/${amb.lng},${amb.lat};${amb.destLng},${amb.destLat}?overview=full&geometries=geojson`
                        );
                        const json = await response.json();

                        if (json.routes && json.routes[0]) {
                            // Convert standard GeoJSON [lng, lat] to Google Maps {lat, lng}
                            const coords = json.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
                            setRoutePolylines(prev => ({
                                ...prev,
                                [amb.id]: coords
                            }));
                        }
                    } catch (err) {
                        console.error("OSRM Route Fetch Failed", err);
                    }
                }
            } else {
                if (routePolylines[amb.id]) {
                    setRoutePolylines(prev => {
                        const newRoutes = { ...prev };
                        delete newRoutes[amb.id];
                        return newRoutes;
                    });
                }
            }
        });
    }, [ambulances]);

    // Helper for Route Color (Now based on Urgency Priority first, then Role)
    const getRouteColor = (amb) => {
        // If they have an active priority from dispatch
        if (amb.priority === 'red') return '#ef4444'; // CRITICAL RED
        if (amb.priority === 'yellow') return '#f59e0b'; // URGENT YELLOW
        if (amb.priority === 'blue') return '#3b82f6'; // NON-CRITICAL BLUE

        // Fallback for idle/unassigned vehicles based on role
        switch (amb.type) {
            case 'fire': return '#ef4444'; // Red
            case 'police':
            case 'traffic_police': return '#3b82f6'; // Blue
            case 'disaster': return '#f97316'; // Orange
            default: return '#10b981'; // Emerald/Green for Ambulance as fallback
        }
    };

    // Helper for Icon URL (Keeps vehicle type standard, color aura handles urgency)
    const getIconUrl = (type) => {
        switch (type) {
            case 'fire': return '/fire_new.png';
            case 'police':
            case 'traffic_police': return '/police_new.png';
            case 'disaster': return '/disaster_new.png';
            default: return '/ambulance_new.png?v=2';
        }
    };

    // Scale icons appropriately
    const getIconSize = (type) => {
        // Assuming icons are roughly 2:1 aspect ratio based on previous code
        return new window.google.maps.Size(60, 30);
    };

    if (loadError) return <div style={{ padding: '40px', color: 'red' }}>Map Error: {loadError.message}</div>;
    if (!isLoaded) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Live Map...</div>;

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#1e293b' }}>Live Tactical Map</h1>
                <p style={{ color: '#64748b' }}>Real-time tracking with Uber-style visualization.</p>
            </div>

            <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={13}
                    options={mapOptions}
                    onLoad={handleMapLoad}
                >
                    {ambulances.map(amb => (
                        <React.Fragment key={amb.id}>
                            {/* Pulsing Aura Circle */}
                            <Circle
                                center={{ lat: amb.lat, lng: amb.lng }}
                                radius={120}
                                options={{
                                    strokeColor: getRouteColor(amb),
                                    strokeOpacity: 0.8,
                                    strokeWeight: 1,
                                    fillColor: getRouteColor(amb),
                                    fillOpacity: 0.15,
                                }}
                            />

                            {/* Vehicle Marker */}
                            <Marker
                                position={{ lat: amb.lat, lng: amb.lng }}
                                icon={{
                                    url: getIconUrl(amb.type),
                                    scaledSize: new window.google.maps.Size(60, 30),
                                    anchor: new window.google.maps.Point(30, 15)
                                }}
                                onClick={() => setSelectedAmbulance(amb)}
                            />

                            {selectedAmbulance && selectedAmbulance.id === amb.id && (
                                <InfoWindow
                                    position={{ lat: amb.lat, lng: amb.lng }}
                                    onCloseClick={() => setSelectedAmbulance(null)}
                                >
                                    <div style={{ padding: '5px', color: '#000' }}>
                                        <b>Unit {amb.id.slice(0, 4)}</b><br />
                                        Type: {amb.type ? amb.type.toUpperCase() : 'UNKNOWN'}<br />
                                        Status: {amb.status}<br />
                                        {amb.priority && <span>Priority: {amb.priority.toUpperCase()}<br /></span>}
                                        Speed: {amb.speed ? `${amb.speed} km/h` : 'N/A'}
                                    </div>
                                </InfoWindow>
                            )}

                            {/* Destination Marker & Route */}
                            {amb.status === 'on_mission' && amb.destLat && (
                                <>
                                    <Marker
                                        position={{ lat: amb.destLat, lng: amb.destLng }}
                                    />

                                    {/* The Exact Polyline */}
                                    {routePolylines[amb.id] ? (
                                        <Polyline
                                            path={routePolylines[amb.id]}
                                            options={{
                                                strokeColor: getRouteColor(amb), // Match aura color
                                                strokeOpacity: 0.8,
                                                strokeWeight: 6,
                                            }}
                                        />
                                    ) : (
                                        /* Fallback straight line */
                                        <Polyline
                                            path={[
                                                { lat: amb.lat, lng: amb.lng },
                                                { lat: amb.destLat, lng: amb.destLng }
                                            ]}
                                            options={{
                                                strokeColor: getRouteColor(amb),
                                                strokeOpacity: 0.6,
                                                strokeWeight: 4,
                                                geodesic: true
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    ))}
                </GoogleMap>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminLiveMap;
