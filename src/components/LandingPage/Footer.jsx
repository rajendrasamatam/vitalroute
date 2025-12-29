import React from 'react';

const Footer = () => {
    return (
        <>
            <section className="ochi-cta">
                <h2>READY TO<br />START THE PROJECT?</h2>

                <button className="ochi-btn-round">
                    START THE ENGINE
                    <div style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%' }}></div>
                </button>
            </section>

            <footer className="ochi-footer">
                <div>VITAL ROUTE</div>
                <div>©2025</div>
            </footer>
        </>
    );
};

export default Footer;
