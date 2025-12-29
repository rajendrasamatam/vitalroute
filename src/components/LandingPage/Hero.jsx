import React from 'react';
import RoadAnimation from './RoadAnimation';

const Hero = () => {
    return (
        <section className="vital-section" style={{ minHeight: 'auto', paddingBottom: 0, overflow: 'hidden' }}>
            <div className="hero-content" style={{ padding: '100px 40px', background: 'var(--color-bg-light)' }}>
                <h1 className="hero-title">WE SAVE LIVES</h1>
                <h1 className="hero-title">BY CLEARING</h1>
                <h1 className="hero-title">THE WAY</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '60px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                    <p className="hero-subtitle" style={{ border: 'none', margin: 0 }}>
                        VITAL ROUTE identifies the nearest response unit.
                    </p>
                    <button className="ochi-btn-round">Start the Engine</button>
                </div>
            </div>

            {/* Scroll/Road Animation */}
            <RoadAnimation />

        </section>
    );
};

export default Hero;
