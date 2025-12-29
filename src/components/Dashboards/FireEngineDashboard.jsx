import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Fire Command' },
    { id: 'map', label: 'Incident Map' },
    { id: 'hydrants', label: 'Hydrant Locations' },
    { id: 'team', label: 'Team Status' },
    { id: 'alerts', label: 'Emergency Alerts' },
    { id: 'equipment', label: 'Equipment Check' },
];

const FireOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Fire Response</h1>
            <p style={{ color: '#666' }}>Fire incident management and team coordination.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Active Incidents" value="2" subtext="Sector 4 & 9" trend="Containment" />
            <StatCard label="Water Level" value="98%" subtext="Tank Capacity" />
            <StatCard label="Crew Strength" value="6" subtext="Members Active" />
        </div>
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

const FireEngineDashboard = () => {
    return (
        <GenericDashboard
            roleTitle="FIRE COMMAND"
            roleId="fire"
            menuItems={MENU_ITEMS}
            OverviewComponent={FireOverview}
            statusColor="#d35400"
        />
    );
};

export default FireEngineDashboard;
