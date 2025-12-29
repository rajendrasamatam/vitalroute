import React from 'react';

const Impact = () => {
    return (
        <section className="vital-section" style={{ background: '#111', borderRadius: '20px 20px 0 0', marginTop: '-40px', zIndex: 10, color: '#fff' }}>
            <div className="impact-grid" style={{ alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', lineHeight: 1, textTransform: 'uppercase' }}>
                    Why VITAL ROUTE<br />Matters
                </h2>

                <div style={{ colSpan: 2 }}>
                    <p style={{ fontSize: '1.25rem', lineHeight: 1.5, marginBottom: '20px', maxWidth: '600px' }}>
                        We eliminate stops at junctions by proactively turning signals green before arrival.
                        Coordinate live mapping and smart signal control across the entire city grid.
                    </p>
                    <button className="ochi-btn-round" style={{ background: '#fff', color: '#000' }}>Read More</button>
                </div>
            </div>
        </section>
    );
};

export default Impact;
