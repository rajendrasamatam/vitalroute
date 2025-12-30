import React, { useState, useEffect } from 'react';

const SmartTrafficDemo = ({ isActive }) => {
    // States: idle, approaching, geofence-active, green-light, passed
    const [animationState, setAnimationState] = useState('idle');

    useEffect(() => {
        if (isActive && animationState === 'idle') {
            setAnimationState('approaching');

            // Sequence timeline
            setTimeout(() => setAnimationState('geofence-active'), 1500); // 1.5s: Geofence triggers
            setTimeout(() => setAnimationState('green-light'), 2500);     // 2.5s: Signal turns green
            setTimeout(() => setAnimationState('passed'), 4000);          // 4.0s: Vehicle passes
            setTimeout(() => setAnimationState('idle'), 6000);            // 6.0s: Reset
        }
    }, [isActive, animationState]);

    return (
        <div style={{
            width: '100%',
            height: '300px',
            background: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            margin: '40px 0',
            borderRadius: '12px',
            border: '1px solid #333',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* HUD Overlay */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 20,
                color: '#fff'
            }}>
                <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VITAL ROUTE SYSTEM</div>
                <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: animationState === 'geofence-active' ? '#00ff88' : '#fff',
                    transition: 'color 0.3s'
                }}>
                    {animationState === 'idle' && "SYSTEM STANDBY"}
                    {animationState === 'approaching' && "VEHICLE DETECTED"}
                    {animationState === 'geofence-active' && "GEOFENCE TRIGGERED (500m)"}
                    {animationState === 'green-light' && "CORRIDOR CLEARED"}
                    {animationState === 'passed' && "PASSED - RESUMING"}
                </div>
            </div>

            {/* Junction / Traffic Light */}
            <div style={{
                position: 'absolute',
                right: '10%',
                top: '20%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 15
            }}>
                <div style={{
                    width: '12px',
                    height: '30px',
                    background: '#000',
                    borderRadius: '6px',
                    padding: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid #444'
                }}>
                    {/* Red Light */}
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: (animationState === 'green-light' || animationState === 'passed') ? '#330000' : '#ff0000',
                        boxShadow: (animationState === 'green-light' || animationState === 'passed') ? 'none' : '0 0 10px #ff0000'
                    }}></div>
                    {/* Amber Light (Briefly unused for simplicity or transition) */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#332200' }}></div>
                    {/* Green Light */}
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: (animationState === 'green-light' || animationState === 'passed') ? '#00ff00' : '#001100',
                        boxShadow: (animationState === 'green-light' || animationState === 'passed') ? '0 0 10px #00ff00' : 'none'
                    }}></div>
                </div>
                <div style={{ height: '40px', width: '2px', background: '#444' }}></div>
            </div>

            {/* Road */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                left: 0,
                width: '100%',
                height: '80px',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                {/* Lane Markings */}
                <div className="demo-road-markings"></div>
            </div>

            {/* Target Line (Junction) */}
            <div style={{
                position: 'absolute', bottom: '40px', right: '10%', width: '4px', height: '80px', background: 'rgba(255,255,255,0.2)'
            }}></div>

            {/* Ambulance Container */}
            <div className={`ambulance-container ${animationState}`}>

                {/* Geofence Circle */}
                <div className="geofence-circle"></div>

                {/* The Vehicle */}
                <div className="ambulance-body">
                    <div className="siren"></div>
                </div>
            </div>

            <style>{`
                .demo-road-markings {
                    width: 200%;
                    height: 2px;
                    background: repeating-linear-gradient(90deg, #666 0, #666 40px, transparent 40px, transparent 80px);
                    animation: demoRoadScroll 4s linear infinite;
                }

                .ambulance-container {
                    position: absolute;
                    bottom: 60px; /* Center in road (40px bottom + 20px padding) */
                    left: -100px;
                    width: 60px;
                    height: 30px;
                    transition: transform 0.5s linear;
                    z-index: 10;
                }

                /* Animation Keyframes mapped to states */
                .ambulance-container.approaching {
                    left: 30%;
                    transition: left 1.5s ease-out;
                }
                .ambulance-container.geofence-active {
                    left: 50%;
                    transition: left 1s linear;
                }
                .ambulance-container.green-light {
                    left: 70%;
                    transition: left 1.5s ease-in; /* Speed up */
                }
                .ambulance-container.passed {
                    left: 120%;
                    transition: left 1.5s ease-in;
                }
                .ambulance-container.idle {
                    left: -100px;
                    transition: none;
                }

                /* Geofence Animation */
                .geofence-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    width: 300px;
                    height: 300px;
                    border: 2px solid rgba(0, 255, 136, 0.5);
                    background: rgba(0, 255, 136, 0.1);
                    border-radius: 50%;
                    opacity: 0;
                    transition: all 0.5s ease;
                }

                .geofence-active .geofence-circle,
                .green-light .geofence-circle {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                    animation: pulseGeofence 2s infinite;
                }

                .passed .geofence-circle {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.5);
                    transition: opacity 0.5s ease;
                }

                /* Ambulance Visuals */
                .ambulance-body {
                    width: 100%;
                    height: 100%;
                    background: #fff;
                    border-radius: 4px;
                    position: relative;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                }
                .ambulance-body::after { /* Tail lights */
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 20%;
                    height: 60%;
                    width: 4px;
                    background: #ff0000;
                }
                .ambulance-body::before { /* Headlights */
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 20%;
                    height: 60%;
                    width: 2px;
                    background: #ffffaa;
                    box-shadow: 0 0 10px #ffffaa;
                }

                .siren {
                    position: absolute;
                    top: -4px;
                    left: 20px;
                    width: 10px;
                    height: 4px;
                    background: #ff0000;
                    animation: sirenFlash 0.4s infinite;
                }

                @keyframes demoRoadScroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                @keyframes pulseGeofence {
                    0% { border-color: rgba(0, 255, 136, 0.5); box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.2); }
                    50% { border-color: rgba(0, 255, 136, 1); box-shadow: 0 0 0 20px rgba(0, 255, 136, 0); }
                    100% { border-color: rgba(0, 255, 136, 0.5); box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
                }

                @keyframes sirenFlash {
                    0% { background: #ff0000; box-shadow: 0 0 10px #ff0000; }
                    50% { background: #0000ff; box-shadow: 0 0 10px #0000ff; }
                    100% { background: #ff0000; box-shadow: 0 0 10px #ff0000; }
                }
            `}</style>
        </div>
    );
};

export default SmartTrafficDemo;
