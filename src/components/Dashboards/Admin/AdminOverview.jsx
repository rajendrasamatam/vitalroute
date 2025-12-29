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
    </div>
);

const AdminOverview = () => {
    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
                <p style={{ color: '#666', maxWidth: '600px' }}>Real-time monitoring of city traffic flow and emergency response efficiency.</p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <StatCard label="Active Emergencies" value="12" subtext="4 Critical" trend="+20%" />
                <StatCard label="Total Vehicles" value="48" subtext="On Duty" />
                <StatCard label="Junctions Controlled" value="156" subtext="Automated" trend="98% Uptime" />
                <StatCard label="Avg. Response Time" value="4:12" subtext="Minutes" trend="-30s" />
            </div>

            {/* Recent Activity / Visual Placeholder */}
            <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                border: '1px dashed #e0e0e0'
            }}>
                <div style={{ fontSize: '1.2rem', color: '#888', marginBottom: '10px' }}>Live Activity Feed</div>
                <p style={{ color: '#bbb' }}>Graphs and activity logs will populate here.</p>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                }
            `}</style>
        </div>
    );
};

export default AdminOverview;
