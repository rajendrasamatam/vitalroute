import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Field Ops' },
    { id: 'installations', label: 'New Installations' },
    { id: 'maintenance', label: 'Maintenance Requests' },
    { id: 'inventory', label: 'Parts Inventory' },
    { id: 'schedule', label: 'Work Schedule' },
    { id: 'diagnostics', label: 'Signal Diagnostics' },
];

import NewInstallations from './NewInstallations';

const InstallerOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Field Operations</h1>
            <p style={{ color: '#666' }}>Installation and maintenance of traffic infrastructure.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Pending Jobs" value="5" subtext="3 Critical" trend="Urgent" />
            <StatCard label="Systems Online" value="100%" subtext="Network Health" />
            <StatCard label="Parts Stock" value="OK" subtext="Reorder Needed" />
        </div>
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

const TrafficInstallerDashboard = () => {
    const renderCustomContent = (viewId) => {
        if (viewId === 'installations') {
            return <NewInstallations />;
        }
        return null; // Fallback to default behavior
    };

    return (
        <GenericDashboard
            roleTitle="INSTALLER UNIT"
            roleId="installer"
            menuItems={MENU_ITEMS}
            OverviewComponent={InstallerOverview}
            statusColor="#f39c12"
            renderCustomContent={renderCustomContent}
        />
    );
};

export default TrafficInstallerDashboard;
