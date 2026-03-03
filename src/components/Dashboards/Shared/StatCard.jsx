import React from 'react';

const StatCard = ({ label, value, subtext, trend }) => (
    <div style={{
        background: '#fff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '180px',
        transition: 'transform 0.2s',
        cursor: 'default'
    }} className="hover-card">
        <div>
            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{label}</div>
            <div style={{ fontSize: '3rem', fontWeight: 600, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>{subtext}</div>
            {trend && (
                <div style={{ padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 600 }}>
                    {trend}
                </div>
            )}
        </div>
        <style>{`
            .hover-card:hover {
                transform: translateY(-5px);
            }
        `}</style>
    </div>
);

export default StatCard;
