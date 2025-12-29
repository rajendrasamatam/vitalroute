import React from 'react';
import DashboardLayout from './DashboardLayout';

const TrafficPoliceDashboard = () => {
    return (
        <DashboardLayout title="Junction Monitor" role="Traffic Police">
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '5px solid green', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    GO
                </div>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    STOP
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TrafficPoliceDashboard;
