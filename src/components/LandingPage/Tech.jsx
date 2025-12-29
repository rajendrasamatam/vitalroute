import React from 'react';

const Tech = () => {
    return (
        <section className="vital-section">
            <div style={{ display: 'flex', gap: '100px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <div style={{ width: 6, height: 6, background: '#000', borderRadius: '50%' }}></div>
                    </div>
                    <h4 style={{ margin: 0, fontWeight: 400, fontSize: '0.9rem', letterSpacing: '0.05em' }}>LIVE TRACKING</h4>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <div style={{ width: 1, height: 20, background: '#000' }}></div>
                        <div style={{ width: 20, height: 1, background: '#000', position: 'absolute' }}></div>
                    </div>
                    <h4 style={{ margin: 0, fontWeight: 400, fontSize: '0.9rem', letterSpacing: '0.05em' }}>SMART CONTROL</h4>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <div style={{ width: 20, height: 20, border: '1px solid #000', borderRadius: '50%' }}></div>
                    </div>
                    <h4 style={{ margin: 0, fontWeight: 400, fontSize: '0.9rem', letterSpacing: '0.05em' }}>PREDICTIVE</h4>
                </div>
            </div>

            <div style={{ marginTop: '160px', textAlign: 'center' }}>
                <h2 className="cta-title">When every second matters,<br />VITAL ROUTE leads the way.</h2>
                <button className="cta-button">Access Dashboard</button>
            </div>
        </section>
    );
};

export default Tech;
