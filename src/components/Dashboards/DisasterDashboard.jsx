import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Disaster Ops' },
    { id: 'regions', label: 'Affected Regions' },
    { id: 'resources', label: 'Resource Allocation' },
    { id: 'evacuation', label: 'Evacuation Routes' },
    { id: 'volunteers', label: 'Volunteer Network' },
    { id: 'alerts', label: 'Broadcast Alerts' },
];

const DisasterOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Disaster Control</h1>
            <p style={{ color: '#666' }}>Strategic oversight for large-scale emergencies.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Alert Level" value="LOW" subtext="Monitoring Phase" trend="Stable" />
            <StatCard label="Resources Deployed" value="12" subtext="Units in Field" />
            <StatCard label="Shelters Open" value="4" subtext="Capacity: 4000" />
        </div>
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

const DisasterDashboard = () => {
    return (
        <GenericDashboard
            roleTitle="DISASTER OPS"
            roleId="disaster"
            menuItems={MENU_ITEMS}
            OverviewComponent={DisasterOverview}
            statusColor="#8e44ad"
        />
    );
};

export default DisasterDashboard;
