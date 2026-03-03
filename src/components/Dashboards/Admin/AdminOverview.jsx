import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const StatCard = ({ label, value, subtext, trend }) => (
    <div style={{
        background: '#fff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '180px',
        transition: 'transform 0.2s',
        cursor: 'default'
    }} className="hover-card">
        <div>
            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{label}</div>
            <div style={{ fontSize: '3rem', fontWeight: 600, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>{subtext}</div>
            {trend && (
                <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
                    {trend}
                </div>
            )}
        </div>
    </div>
);

// Helper for Traffic Icon
const trafficIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const AdminOverview = () => {
    const [stats, setStats] = useState({
        emergencies: 0,
        vehicles: 0,
        junctions: 0,
        responseTime: '0:00'
    });

    const [activeEmergencies, setActiveEmergencies] = useState([]);
    const [signals, setSignals] = useState([]);

    useEffect(() => {
        // 1. Listen to Emergencies
        const unsubEmergencies = onSnapshot(collection(db, "emergency_requests"), (snap) => {
            setStats(prev => ({ ...prev, emergencies: snap.size }));
            // Parse for Map
            const list = snap.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            }).filter(item => item.location && (item.status === 'active' || item.status === 'pending' || !item.status));
            setActiveEmergencies(list);
        }, () => { });

        // 2. Listen to Vehicles (Users with fleet roles)
        const qVehicles = query(collection(db, "users"), where("role", "in", ["ambulance", "fire", "police"]));
        const unsubVehicles = onSnapshot(qVehicles, (snap) => {
            setStats(prev => ({ ...prev, vehicles: snap.size }));
        }, () => { });

        // 3. Listen to Signals
        const unsubSignals = onSnapshot(collection(db, "signals"), (snap) => {
            setStats(prev => ({ ...prev, junctions: snap.size }));

            // Parse for Map
            const signalList = snap.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            }).filter(item => item.location);
            setSignals(signalList);
        }, () => { });

        return () => {
            unsubEmergencies();
            unsubVehicles();
            unsubSignals();
        };
    }, []);

    // Helper to extract Lat/Lng safely
    const getLatLng = (loc) => {
        if (!loc) return null;
        const lat = loc.lat || loc.latitude;
        const lng = loc.lng || loc.longitude;
        if (lat && lng) return [lat, lng];
        return null;
    };

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
                <p style={{ color: '#666', maxWidth: '600px' }}>Real-time monitoring of city traffic flow and emergency response efficiency.</p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <StatCard
                    label="Active Emergencies"
                    value={stats.emergencies}
                    subtext="Real-time Reports"
                />
                <StatCard
                    label="Active Fleet"
                    value={stats.vehicles}
                    subtext="Units Deployed"
                />
                <StatCard
                    label="Junctions Controlled"
                    value={stats.junctions}
                    subtext="Smart Signals Online"
                    trend="Stable"
                />
                <StatCard
                    label="Avg. Response Time"
                    value={stats.responseTime}
                    subtext="Minutes (Est.)"
                />
            </div>

            {/* Live Map Activity Feed */}
            <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #eee'
            }}>
                <div style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px', marginLeft: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Live Traffic & Emergency Map</span>
                    <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '5px 10px', borderRadius: '20px' }}>
                        LIVE UPDATE
                    </span>
                </div>

                {/* Explicit Height for Map Wrapper to prevent collapse */}
                <div style={{ height: '500px', width: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                    <MapContainer
                        center={[17.3850, 78.4867]}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {/* Emergency Markers */}
                        {activeEmergencies.map((em) => {
                            const pos = getLatLng(em.location);
                            if (!pos) return null;
                            return (
                                <Marker key={em.id} position={pos}>
                                    <Popup>
                                        <strong>{em.type || "Emergency"}</strong><br />
                                        Reported by: {em.userName || "Unknown"}<br />
                                        Status: {em.status || "Active"}
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Traffic Signal Markers */}
                        {signals.map((sig) => {
                            const pos = getLatLng(sig.location);
                            if (!pos) return null;
                            return (
                                <Marker key={sig.id} position={pos} icon={trafficIcon}>
                                    <Popup>
                                        <strong>Traffic Signal</strong><br />
                                        ID: {sig.lightId || sig.id}<br />
                                        Status: {sig.status || "Working"}<br />
                                        Direction: {sig.direction}°
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                }
                .leaflet-container {
                    height: 100%;
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default AdminOverview;
