import React, { useState } from 'react';

const FEATURES = [
    {
        id: 'gps',
        label: 'REAL-TIME TRACKING',
        title: 'LIVE GPS',
        desc: 'Continuously tracks emergency vehicles in real time to anticipate upcoming junctions.'
    },
    {
        id: 'signals',
        label: 'SMART SIGNALS',
        title: 'ZERO DELAY',
        desc: 'Eliminates stops by converting red lights to green before the vehicle arrives.'
    },
    {
        id: 'corridor',
        label: 'SIGNAL SYNC',
        title: 'GREEN CORRIDOR',
        desc: 'Creates an uninterrupted path by synchronizing multiple traffic signals ahead of the vehicle.'
    },
    {
        id: 'routing',
        label: 'PATH ANALYSIS',
        title: 'PREDICTIVE ROUTING',
        desc: 'Analyzes the fastest route in advance using live traffic conditions and historical data.'
    },
    {
        id: 'preemption',
        label: 'PRIORITY ACCESS',
        title: 'JUNCTION PREEMPTION',
        desc: 'Clears the intersection seconds before arrival to prevent collision risks.'
    },
    {
        id: 'cloud',
        label: 'GRID SYNC',
        title: 'CLOUD COORDINATION',
        desc: 'Centralized cloud brain orchestrating the entire city traffic grid for emergency flow.'
    },
    {
        id: 'priority',
        label: 'OVERRIDE',
        title: 'EMERGENCY PRIORITY',
        desc: 'Grants absolute right-of-way to ambulances and fire engines over all other feedback.'
    }
];

// Double the array for seamless CSS loop
const SCROLL_ITEMS = [...FEATURES, ...FEATURES];

const TrafficScroll = () => {
    const [selected, setSelected] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    return (
        <div style={{ position: 'relative', overflow: 'hidden', padding: '160px 0 100px 0', background: 'var(--color-bg-light)' }}>
            <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                lineHeight: 1,
                marginBottom: '80px',
                padding: '0 20px',
                textAlign: 'center',
                textTransform: 'uppercase',
                color: '#000000',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 20,
                width: '100%',
                display: 'block',
                whiteSpace: 'nowrap'
            }}>
                INTELLIGENT TRAFFIC CONTROL
            </h2>

            {/* Marquee Track Container */}
            <div
                className="marquee-track"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                style={{
                    display: 'flex',
                    gap: '20px',
                    width: 'max-content',
                    animation: 'marqueeScroll 40s linear infinite', /* Smooth slow scroll */
                    animationPlayState: isPaused ? 'paused' : 'running',
                    paddingLeft: '40px'
                }}
            >
                {SCROLL_ITEMS.map((item, index) => (
                    <div
                        key={`${item.id}-${index}`}
                        onClick={() => setSelected(item)}
                        className="scroll-card"
                        style={{
                            minWidth: '320px',
                            height: '400px',
                            background: '#1a1a1a',
                            borderRadius: '16px',
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                            position: 'relative',
                            transition: 'transform 0.3s ease, background 0.3s ease',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{
                            color: '#999',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-body)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}>
                            {item.label}
                        </span>

                        <h3 style={{
                            color: '#fff',
                            fontSize: '2.5rem',
                            fontFamily: 'var(--font-heading)',
                            lineHeight: 1,
                            margin: 0
                        }}>
                            {item.title}
                        </h3>

                        <div className="card-arrow" style={{
                            width: 40,
                            height: 40,
                            border: '1px solid #333',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}>
                            →
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay */}
            {selected && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#111',
                            padding: '60px',
                            borderRadius: '20px',
                            maxWidth: '600px',
                            width: '100%',
                            color: '#fff',
                            position: 'relative',
                            boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
                            border: '1px solid #333'
                        }}
                    >
                        <span style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{selected.label}</span>
                        <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', margin: '20px 0' }}>{selected.title}</h2>
                        <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: '#ccc', fontFamily: 'var(--font-body)' }}>
                            {selected.desc}
                        </p>
                        <button
                            onClick={() => setSelected(null)}
                            style={{
                                marginTop: '40px',
                                padding: '15px 30px',
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes marqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                
                .scroll-card:hover {
                    transform: translateY(-10px);
                    background: #222 !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default TrafficScroll;
