import React, { useState, useEffect } from 'react';
import { useLoadScript, GoogleMap, TrafficLayer, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Navigation, Layers, Maximize } from 'lucide-react';

const libraries = ['places'];

// Map container style
const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
};

const defaultCenter = {
    lat: 12.9716, // Default fallback (Bangalore)
    lng: 77.5946
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [ // Dark mode style for "wow" factor
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
    ]
};

const AmbulanceRouteMap = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [currentLocation, setCurrentLocation] = useState(null);
    const [trafficLayer, setTrafficLayer] = useState(true);
    const [activeDestination, setActiveDestination] = useState(null); // { lat, lng }

    // Simulate getting location
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.log(error),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Load active route from localStorage (shared with Overview)
    useEffect(() => {
        const saved = localStorage.getItem('activeRoute');
        if (saved) {
            const route = JSON.parse(saved);
            setActiveDestination({ lat: route.lat, lng: route.lng });
        }
    }, []);

    if (loadError) return <div className="text-red-500 p-4">Map Error</div>;
    if (!isLoaded) return <div className="p-4 text-gray-500">Loading Map Intelligence...</div>;

    return (
        <div style={{ height: 'calc(100vh - 140px)', width: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

            {/* Map Controls Overlay */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10,
                background: 'rgba(25, 25, 25, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={() => setTrafficLayer(!trafficLayer)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: trafficLayer ? '#3b82f6' : 'transparent',
                        color: trafficLayer ? '#fff' : '#ccc',
                        border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                        fontSize: '0.9rem'
                    }}
                >
                    <Layers size={18} />
                    {trafficLayer ? 'Traffic On' : 'Traffic Off'}
                </button>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                <div style={{ color: '#aaa', fontSize: '0.75rem', padding: '0 4px' }}>
                    MODE: <span style={{ color: '#fff', fontWeight: 'bold' }}>TACTICAL</span>
                </div>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentLocation || defaultCenter}
                zoom={14}
                options={mapOptions}
            >
                {trafficLayer && <TrafficLayer />}

                {currentLocation && (
                    <Marker
                        position={currentLocation}
                        icon={{
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                            rotation: 0 // In real app, use heading from compass
                        }}
                    />
                )}

                {/* If we had directions service integrated fully, we'd render the route line here.
                    For now, showing destination marker. */}
                {activeDestination && (
                    <Marker
                        position={activeDestination}
                        animation={window.google.maps.Animation.BOUNCE}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default AmbulanceRouteMap;
