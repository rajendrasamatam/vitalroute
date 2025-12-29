import React from 'react';
import DashboardLayout from './DashboardLayout';

const AdminDashboard = () => {
    return (
        <DashboardLayout title="City Command Center" role="Administrator">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', marginTop: '40px' }}>
                {['Traffic Grid', 'Emergency Alerts', 'System Health'].map(item => (
                    <div key={item} style={{ background: '#f9f9f9', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
                        <h3 style={{ margin: 0 }}>{item}</h3>
                        <div style={{ marginTop: '10px', color: 'green' }}>Active</div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
