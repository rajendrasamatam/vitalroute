import React, { useState } from 'react';
import RoadAnimation from './RoadAnimation';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    // Config for "Start The Engine" Demo
    const [config, setConfig] = useState({ type: 'normal', road: 'r1' });


    const handleStart = () => {
        navigate('/demo', { state: config });
    };



    return (
        <section className="vital-section" style={{ minHeight: 'auto', paddingBottom: 0, overflow: 'hidden' }}>
            <div className="hero-content" style={{ background: 'var(--color-bg-light)' }}>
                <h1 className="hero-title">WE SAVE LIVES</h1>
                <h1 className="hero-title">BY CLEARING</h1>
                <h1 className="hero-title">THE WAY</h1>

                <div className="hero-cta-container">
                    <p className="hero-subtitle" style={{ border: 'none', margin: 0 }}>
                        VITAL ROUTE identifies the nearest response unit.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="ochi-btn-round" onClick={() => setShowModal(true)}>Start the Engine</button>
                    </div>
                </div>
            </div>

            {/* Scroll/Road Animation */}
            <RoadAnimation />

            {/* 1. SIMULATION SETUP MODAL (Existing) */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: '30px', borderRadius: '16px',
                        width: '90%', maxWidth: '400px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#111' }}>Simulation Setup</h2>
                        {/* TYPE SELECTION */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: '#666' }}>SCENARIO TYPE</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setConfig({ ...config, type: 'normal' })}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
                                        background: config.type === 'normal' ? '#111' : '#fff',
                                        color: config.type === 'normal' ? '#fff' : '#333',
                                        cursor: 'pointer'
                                    }}
                                >Normal Traffic</button>
                                <button
                                    onClick={() => setConfig({ ...config, type: 'ambulance' })}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
                                        background: config.type === 'ambulance' ? '#ef4444' : '#fff',
                                        color: config.type === 'ambulance' ? '#fff' : '#ef4444',
                                        cursor: 'pointer', fontWeight: 600
                                    }}
                                >🚑 Ambulance</button>
                            </div>
                        </div>

                        {/* ROAD SELECTION (Only for Ambulance) */}
                        {config.type === 'ambulance' && (
                            <div style={{ marginBottom: '20px', animation: 'fadeIn 0.3s' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', color: '#666' }}>INCOMING FROM</label>
                                <select
                                    value={config.road}
                                    onChange={(e) => setConfig({ ...config, road: e.target.value })}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
                                        fontSize: '1rem', outline: 'none'
                                    }}
                                >
                                    <option value="r1">Road 1 (Bottom)</option>
                                    <option value="r2">Road 2 (Left)</option>
                                    <option value="r3">Road 3 (Right)</option>
                                </select>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#f4f4f5', color: '#333', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button onClick={handleStart} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: config.type === 'ambulance' ? '#ef4444' : '#111', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>START SIMULATION</button>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
};

export default Hero;
