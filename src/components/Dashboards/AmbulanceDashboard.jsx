import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Mission Control' },
    { id: 'map', label: 'Navigation Map' },
    { id: 'hospitals', label: 'Hospital Status' },
    { id: 'history', label: 'Trip History' },
    { id: 'alerts', label: 'Incoming Alerts' },
    { id: 'settings', label: 'Vehicle Settings' },
];

const AmbulanceOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Ambulance Unit</h1>
            <p style={{ color: '#666' }}>Active mission status and navigation controls.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Current Mission" value="LIVE" subtext="En Route to Sacred Heart" trend="High Priority" />
            <StatCard label="ETA to Dest" value="4m 12s" subtext="Green Corridor Active" />
            <StatCard label="Shift Duration" value="6h 30m" subtext="On Duty" />
        </div>
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

const AmbulanceDashboard = () => {
    return (
        <GenericDashboard
            roleTitle="AMBULANCE UNIT"
            roleId="ambulance"
            menuItems={MENU_ITEMS}
            OverviewComponent={AmbulanceOverview}
            statusColor="#e74c3c"
        />
    );
};

export default AmbulanceDashboard;
