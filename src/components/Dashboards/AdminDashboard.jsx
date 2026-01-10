import React from 'react';
import GenericDashboard from './GenericDashboard';
import AdminOverview from './Admin/AdminOverview';
import UserManagement from './Admin/UserManagement';
import {
    EmergencyRequests,
    ActiveVehicles,
    MakeTrafficSignals as TrafficSignals,
    SystemLogs,
    AdminSettings
} from './Admin/AdminComponents';

const MENU_ITEMS = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'users', label: 'User & Role Management' },
    { id: 'map', label: 'Live Traffic Map' },
    { id: 'requests', label: 'Emergency Requests' },
    { id: 'vehicles', label: 'Active Vehicles' },
    { id: 'signals', label: 'Traffic Signals & Junctions' },
    { id: 'corridor', label: 'Green Corridor Status' },
    { id: 'logs', label: 'System Logs & History' },
    { id: 'settings', label: 'Settings' },
];

const AdminDashboard = () => {
    return (
        <GenericDashboard
            roleTitle="COMMAND CENTER"
            roleId="admin"
            menuItems={MENU_ITEMS}
            OverviewComponent={AdminOverview}
            renderCustomContent={(view) => {
                switch (view) {
                    case 'users': return <UserManagement />;
                    case 'requests': return <EmergencyRequests />;
                    case 'vehicles': return <ActiveVehicles />;
                    case 'signals': return <TrafficSignals />;
                    case 'logs': return <SystemLogs />;
                    case 'settings': return <AdminSettings />;
                    default: return null;
                }
            }}
        />
    );
};

export default AdminDashboard;
