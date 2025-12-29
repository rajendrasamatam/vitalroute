import React, { useEffect, useState } from 'react';

const RoadAnimation = () => {
    return (
        <div style={{
            width: '100%',
            height: '160px',
            background: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            margin: '40px 0',
            display: 'flex',
            alignItems: 'center'
        }}>
            {/* Moving Lane Markings */}
            <div className="road-markings"></div>

            {/* Normal Traffic */}
            <div className="vehicle vehicle-normal" style={{ left: '20%', animationDelay: '0s' }}></div>
            <div className="vehicle vehicle-normal" style={{ left: '50%', animationDelay: '-2s' }}></div>
            <div className="vehicle vehicle-normal" style={{ left: '80%', animationDelay: '-5s' }}></div>

            {/* Emergency Vehicle - Faster & Blinking */}
            <div className="vehicle vehicle-emergency">
                <div className="siren-light"></div>
            </div>

            <style>{`
                .road-markings {
                    position: absolute;
                    width: 200%;
                    height: 2px;
                    background: repeating-linear-gradient(90deg, #555 0, #555 40px, transparent 40px, transparent 80px);
                    top: 50%;
                    transform: translateY(-50%);
                    animation: roadScroll 2s linear infinite;
                }

                .vehicle {
                    position: absolute;
                    width: 80px;
                    height: 34px;
                    border-radius: 4px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }

                .vehicle::after {
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 80%;
                    background: #ff3333; /* Red Tail Lights */
                    border-radius: 2px;
                    opacity: 0.8;
                }

                .vehicle-normal {
                    background: #333;
                    top: 60%; /* Bottom lane */
                    animation: trafficMove 8s linear infinite;
                }

                .vehicle-emergency {
                    background: #fff;
                    width: 90px;
                    top: 30%; /* Top lane (Overtaking) */
                    animation: emergencyMove 4s linear infinite;
                    z-index: 10;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .vehicle-emergency::after {
                    display: none; /* No tail lights on top/front view or keep them? Let's assume side/top view. Remove generic tail light for custom siren focus or keep both? Let's keep general tail light on emergency too for consistancy, actually let's re-add it specific. */
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 80%;
                    background: #ff3333;
                }

                .siren-light {
                    width: 16px;
                    height: 8px;
                    border-radius: 4px;
                    position: absolute;
                    top: 5px;
                    left: 20px; /* Roof position */
                    animation: sirenBlink 0.5s infinite steps(2);
                }

                @keyframes roadScroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                @keyframes trafficMove {
                    from { transform: translateX(100vw); }
                    to { transform: translateX(-200px); }
                }

                @keyframes emergencyMove {
                    0% { transform: translateX(-200px); }
                    100% { transform: translateX(100vw); }
                }

                @keyframes sirenBlink {
                    0% { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
                    50% { background: #0000ff; box-shadow: 0 0 15px #0000ff; }
                }
            `}</style>
        </div>
    );
};

export default RoadAnimation;
