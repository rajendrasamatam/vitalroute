import React, { useState, useEffect } from 'react';
import { Activity, Heart, Wind, Thermometer, User, Clock, AlertTriangle } from 'lucide-react';

const VitalCard = ({ title, value, unit, icon: Icon, color, status, subtext, trend }) => (
    <div style={{
        background: '#1f2937', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
        {/* Background Pulse Effect for Critical Status */}
        {status === 'critical' && (
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                animation: 'pulse-bg 1s infinite'
            }} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
                <div style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    {title}
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '800', color: color, lineHeight: 1, letterSpacing: '-0.02em', textShadow: `0 0 20px ${color}40` }}>
                    {value}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px', fontWeight: '500' }}>
                    {unit}
                </div>
            </div>
            <div style={{
                background: `${color}20`, padding: '12px', borderRadius: '12px', color: color,
                boxShadow: `inset 0 0 10px ${color}10`
            }}>
                <Icon size={28} />
            </div>
        </div>

        {/* Simulated Graph Line */}
        <div style={{ height: '40px', marginTop: '20px', display: 'flex', alignItems: 'flex-end', gap: '3px', opacity: 0.5 }}>
            {trend.map((h, i) => (
                <div key={i} style={{
                    flex: 1,
                    background: color,
                    height: `${h}%`,
                    borderRadius: '2px',
                    transition: 'height 0.2s ease'
                }} />
            ))}
        </div>

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: status === 'stable' ? '#10b981' : '#ef4444' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{status}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {subtext}
            </div>
        </div>
    </div>
);

const PatientVitals = () => {
    const [simulate, setSimulate] = useState(true);

    // Core Vitals State
    const [hr, setHr] = useState(72);
    const [spo2, setSpo2] = useState(98);
    const [bpSys, setBpSys] = useState(120);
    const [bpDia, setBpDia] = useState(80);
    const [resp, setResp] = useState(16);

    // Trend Arrays for visualizers (array of 0-100 heights)
    const [hrTrend, setHrTrend] = useState(Array(20).fill(40));

    useEffect(() => {
        if (!simulate) return;

        const interval = setInterval(() => {
            // Heart Rate Variation
            setHr(prev => {
                const change = Math.floor(Math.random() * 5) - 2;
                return Math.max(40, Math.min(180, prev + change));
            });

            // Update Graph
            setHrTrend(prev => {
                const nextHeight = Math.random() * 60 + 20; // Random height 20-80%
                return [...prev.slice(1), nextHeight];
            });

            // SpO2 (Stabler)
            if (Math.random() > 0.7) {
                setSpo2(prev => Math.max(85, Math.min(100, prev + (Math.random() > 0.5 ? 1 : -1))));
            }

            // BP
            if (Math.random() > 0.8) {
                setBpSys(prev => prev + (Math.floor(Math.random() * 3) - 1));
                setBpDia(prev => prev + (Math.floor(Math.random() * 3) - 1));
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [simulate]);

    // Derived Status
    const getStatus = (val, low, high) => (val < low || val > high) ? 'critical' : 'stable';

    return (
        <div style={{ padding: '0 0 20px 0', fontFamily: "'Inter', sans-serif" }}>

            {/* Control Bar */}
            <div style={{
                background: '#111827', padding: '20px', borderRadius: '16px', marginBottom: '24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#374151', padding: '10px', borderRadius: '50%' }}>
                        <User size={24} color="#9ca3af" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>John Doe (M, 45)</h2>
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Last Vitals Sync: <span style={{ color: '#10b981' }}>Live</span></span>
                            <span>•</span>
                            <span>Case ID: #AMB-2024-882</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: simulate ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {simulate && <span className="animate-ping" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>}
                        {simulate ? 'MONITORING ACTIVE' : 'SIMULATION PAUSED'}
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: 60, height: 34 }}>
                        <input type="checkbox" checked={simulate} onChange={() => setSimulate(!simulate)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: simulate ? '#10b981' : '#ccc', borderRadius: 34, transition: '.4s'
                        }}>
                            <span style={{
                                position: 'absolute', content: '""', height: 26, width: 26, left: 4, bottom: 4,
                                backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                transform: simulate ? 'translateX(26px)' : 'none'
                            }} />
                        </span>
                    </label>
                </div>
            </div>

            {/* Vitals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <VitalCard
                    title="HEART RATE"
                    value={hr}
                    unit="bpm"
                    icon={Heart}
                    color="#ef4444"
                    status={getStatus(hr, 50, 110)}
                    subtext="Regular Rhythm"
                    trend={hrTrend}
                />
                <VitalCard
                    title="BLOOD OXYGEN"
                    value={spo2}
                    unit="%"
                    icon={Activity}
                    color="#3b82f6"
                    status={getStatus(spo2, 92, 100)}
                    subtext="Target > 94%"
                    trend={hrTrend.map(v => Math.min(100, v + 20))}
                />
                <VitalCard
                    title="BLOOD PRESSURE"
                    value={<span style={{ fontSize: '2.5rem' }}>{bpSys}<span style={{ fontSize: '1.5rem', opacity: 0.6 }}>/{bpDia}</span></span>}
                    unit="mmHg"
                    icon={Thermometer}
                    color="#f59e0b"
                    status={getStatus(bpSys, 90, 140)}
                    subtext="MAP: 93 mmHg"
                    trend={hrTrend.slice(0, 15)}
                />
                <VitalCard
                    title="RESPIRATION"
                    value={resp}
                    unit="breaths/min"
                    icon={Wind}
                    color="#10b981"
                    status={getStatus(resp, 12, 20)}
                    subtext="Clear Airway"
                    trend={hrTrend.slice(5, 20)}
                />
            </div>

            <style>{`
                @keyframes pulse-bg {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.1; }
                    100% { opacity: 0.5; }
                }
                .animate-ping {
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default PatientVitals;
