import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <>
            <section className="ochi-cta">
                <h2>READY TO<br />START THE PROJECT?</h2>

                <button className="ochi-btn-round" onClick={() => navigate('/signup')}>
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
