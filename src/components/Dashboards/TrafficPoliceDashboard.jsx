import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Patrol Dashboard' },
    { id: 'map', label: 'Traffic Map' },
    { id: 'signals', label: 'Signal Control' },
    { id: 'violations', label: 'Violations' },
    { id: 'assignments', label: 'Duty Assignments' },
    { id: 'reports', label: 'File Report' },
];

const PoliceOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Traffic Control</h1>
            <p style={{ color: '#666' }}>Monitoring and enforcement of traffic regulations.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Congestion Level" value="MODERATE" subtext="Sector 7 High" trend="+5%" />
            <StatCard label="Active Patrols" value="14" subtext="Officers on Duty" />
            <StatCard label="Violations Logged" value="42" subtext="Past 24 Hours" />
        </div>
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

const TrafficPoliceDashboard = () => {
    return (
        <GenericDashboard
            roleTitle="TRAFFIC POLICE"
            roleId="police"
            menuItems={MENU_ITEMS}
            OverviewComponent={PoliceOverview}
            statusColor="#2980b9"
        />
    );
};

export default TrafficPoliceDashboard;
