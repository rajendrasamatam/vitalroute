import React from 'react';
import DashboardLayout from './DashboardLayout';

const TrafficInstallerDashboard = () => {
    return (
        <DashboardLayout title="Hardware Configuration" role="Traffic Lights Installer">
            <code>
                System Status: ONLINE <br />
                Signal ID: #4492 <br />
                Latency: 12ms
            </code>
        </DashboardLayout>
    );
};

export default TrafficInstallerDashboard;
