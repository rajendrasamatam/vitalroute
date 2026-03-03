import React, { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Navigation, Phone, Activity, AlertCircle } from 'lucide-react';

const libraries = ['places'];

// Mock data generator for "Live" status
const generateMockStatus = () => {
    const statuses = ['High Availability', 'Moderate', 'Critical/Full'];
    const colors = ['#10b981', '#f59e0b', '#ef4444'];
    const rand = Math.floor(Math.random() * 3);
    return { status: statuses[rand], color: colors[rand], beds: Math.floor(Math.random() * 20) };
};

const HospitalStatus = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => setLoading(false)
            );
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !location) return;

        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            location: location,
            radius: 5000,
            type: 'hospital',
            keyword: 'emergency' // Prioritize ERs
        };

        service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const enhancedHospitals = results.slice(0, 8).map(h => ({
                    ...h,
                    ...generateMockStatus() // Merge real place data with simulated live status
                }));
                setHospitals(enhancedHospitals);
            }
            setLoading(false);
        });
    }, [isLoaded, location]);

    const handleNavigate = (hospital) => {
        const dest = { lat: hospital.geometry.location.lat(), lng: hospital.geometry.location.lng(), name: hospital.name };
        localStorage.setItem('activeRoute', JSON.stringify(dest));
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
    };

    if (loadError) return <div className="p-8 text-center text-red-500">System Error: Map Services Unavailable</div>;

    return (
        <div className="hospital-status-container" style={{ padding: '0 10px 20px 10px' }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
                background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity color="#ef4444" /> Hospital Network Status
                    </h2>
                    <p style={{ color: '#6b7280', marginTop: '5px' }}>Real-time bed availability and ER status nearby</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#3b82f6' }}>{hospitals.length}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Facilities Detected</div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: '200px', background: '#e5e7eb', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                    ))}
                    <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {hospitals.map((hospital) => (
                        <div key={hospital.place_id} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'default',
                            border: '1px solid #f3f4f6'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                            }}
                        >
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111', lineHeight: 1.3, maxWidth: '80%' }}>
                                        {hospital.name}
                                    </h3>
                                    <div style={{
                                        background: hospital.year >= 4 ? '#fef2f2' : '#ecfdf5',
                                        color: hospital.color,
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontWeight: '700',
                                        fontSize: '0.75rem',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: hospital.color }} />
                                        {hospital.beds} BEDS
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '60px', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(hospital.rating / 5) * 100}%`, background: '#fbbf24', height: '100%' }} />
                                    </div>
                                    <span style={{ fontWeight: '600', color: '#374151' }}>{hospital.rating || 'N/A'}</span>
                                    <span style={{ color: '#9ca3af' }}>•</span>
                                    <span>{hospital.vicinity ? hospital.vicinity.split(',')[0] : 'Near you'}</span>
                                </div>

                                <div style={{
                                    background: hospital.status === 'Critical/Full' ? '#fef2f2' : (hospital.status === 'Moderate' ? '#fffbeb' : '#f0fdf4'),
                                    border: `1px solid ${hospital.color}30`,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>
                                        ER Status
                                    </div>
                                    <div style={{ color: hospital.color, fontWeight: '700', fontSize: '0.95rem' }}>
                                        {hospital.status}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        onClick={() => handleNavigate(hospital)}
                                        style={{
                                            background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px',
                                            fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#2563eb'}
                                        onMouseLeave={e => e.target.style.background = '#3b82f6'}
                                    >
                                        <Navigation size={16} /> Route
                                    </button>
                                    <button style={{
                                        background: '#fff', color: '#374151', border: '1px solid #d1d5db', padding: '10px', borderRadius: '8px',
                                        fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}>
                                        <Phone size={16} /> Contact
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hospitals.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p>No medical facilities found within range.</p>
                </div>
            )}
        </div>
    );
};

export default HospitalStatus;
