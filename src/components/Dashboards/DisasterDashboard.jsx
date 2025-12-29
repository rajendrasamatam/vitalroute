import React from 'react';
import DashboardLayout from './DashboardLayout';

const DisasterDashboard = () => {
    return (
        <DashboardLayout title="Disaster Control" role="Disaster Management">
            <div style={{ width: '100%', height: '100px', background: '#eee', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                MAP VIEW LOADING...
            </div>
        </DashboardLayout>
    );
};

export default DisasterDashboard;
