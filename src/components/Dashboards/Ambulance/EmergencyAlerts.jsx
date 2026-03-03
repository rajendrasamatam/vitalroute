import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

const EmergencyAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Simulated alerts for visual demo
    useEffect(() => {
        const mockAlerts = [
            { id: '1', type: 'accident', title: 'Multi-Vehicle Collision', location: 'Silk Board Junction', distance: '2.5 km', time: '2 mins ago', priority: 'high', status: 'pending' },
            { id: '2', type: 'medical', title: 'Cardiac Arrest', location: 'Koramangala 4th Block', distance: '4.1 km', time: '15 mins ago', priority: 'critical', status: 'pending' },
            { id: '3', type: 'fire', title: 'Apartment Fire Support', location: 'Indiranagar', distance: '8.0 km', time: '32 mins ago', priority: 'medium', status: 'assigned' },
        ];

        setTimeout(() => {
            setAlerts(mockAlerts);
            setLoading(false);
        }, 800);
    }, []);

    const handleAction = (id, action) => {
        setAlerts(prev => prev.map(alert => {
            if (alert.id === id) {
                return { ...alert, status: action === 'accept' ? 'accepted' : 'rejected' };
            }
            return alert;
        }));
    };

    const getPriorityColor = (p) => {
        if (p === 'critical') return '#ef4444';
        if (p === 'high') return '#f97316';
        return '#3b82f6';
    };

    return (
        <div style={{ padding: '0 0 40px 0', fontFamily: "'Inter', sans-serif" }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px',
            }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Bell size={32} />
                            <span style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, background: '#ef4444', borderRadius: '50%', border: '2px solid #f4f4f4' }} />
                        </div>
                        Emergency Dispatch
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '1rem', marginTop: '4px' }}>Manage incoming requests and active missions</p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {alerts.map(alert => (
                    <div key={alert.id} style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        borderLeft: `6px solid ${getPriorityColor(alert.priority)}`,
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr auto',
                        gap: '24px',
                        alignItems: 'center',
                        opacity: alert.status === 'rejected' ? 0.5 : 1,
                        transform: alert.status === 'accepted' ? 'scale(1.01)' : 'none',
                        transition: 'all 0.3s ease'
                    }}>
                        {/* Icon Box */}
                        <div style={{
                            height: '80px', width: '80px', borderRadius: '12px',
                            background: `${getPriorityColor(alert.priority)}15`,
                            color: getPriorityColor(alert.priority),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: '6px'
                        }}>
                            <AlertTriangle size={28} />
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>{alert.priority}</span>
                        </div>

                        {/* Content */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{alert.title}</h3>
                                {alert.status === 'pending' && <span className="blink-badge">NEW</span>}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#6b7280', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} /> {alert.location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ArrowRight size={16} /> {alert.distance}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={16} /> {alert.time}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {alert.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleAction(alert.id, 'reject')}
                                        style={{
                                            background: '#fef2f2', color: '#ef4444', border: 'none',
                                            padding: '12px 24px', borderRadius: '10px', fontWeight: '600',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <XCircle size={18} /> DECLINE
                                    </button>
                                    <button
                                        onClick={() => handleAction(alert.id, 'accept')}
                                        style={{
                                            background: '#10b981', color: '#fff', border: 'none',
                                            padding: '12px 30px', borderRadius: '10px', fontWeight: '600',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                    >
                                        <CheckCircle size={18} /> RESPOND
                                    </button>
                                </>
                            )}

                            {alert.status === 'accepted' && (
                                <div style={{
                                    padding: '12px 24px', background: '#ecfdf5', color: '#059669',
                                    borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <CheckCircle size={20} /> MISSION ACTIVE
                                </div>
                            )}

                            {alert.status === 'assigned' && (
                                <div style={{
                                    padding: '12px 24px', background: '#f3f4f6', color: '#6b7280',
                                    borderRadius: '10px', fontWeight: '600'
                                }}>
                                    Assigned to Unit #42
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .blink-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 99px;
                    font-weight: 700;
                    animation: blink 1s infinite;
                }
                @keyframes blink {
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default EmergencyAlerts;
