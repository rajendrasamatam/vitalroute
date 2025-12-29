import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, role, children }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            width: '100vw',
            minHeight: '100vh',
            background: '#F4F4F4',
            color: '#111',
            fontFamily: 'Inter, sans-serif'
        }}>
            <nav style={{
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #ddd',
                background: '#fff'
            }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>VITAL ROUTE <span style={{ fontWeight: 400, color: '#666' }}>/ {role}</span></div>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '10px 20px',
                        border: '1px solid #111',
                        borderRadius: '30px',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Logout
                </button>
            </nav>

            <main style={{ padding: '60px 40px' }}>
                <h1 style={{ fontSize: '3rem', fontFamily: 'Oswald, sans-serif', marginBottom: '40px', textTransform: 'uppercase' }}>
                    {title}
                </h1>
                <div style={{
                    padding: '40px',
                    background: '#fff',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>
                        {title.charAt(0)}
                    </div>
                    <p style={{ color: '#666', fontSize: '1.2rem', maxWidth: '500px', textAlign: 'center' }}>
                        This is the dedicated dashboard for <strong>{role}</strong> operations. <br />
                        Real-time data streams and controls would appear here.
                    </p>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
