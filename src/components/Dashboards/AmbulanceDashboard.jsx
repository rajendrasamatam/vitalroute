import React from 'react';
import GenericDashboard from './GenericDashboard';
import StatCard from './Shared/StatCard';

const MENU_ITEMS = [
    { id: 'overview', label: 'Ambulance Unit' },
    { id: 'map', label: 'Route Map' },
    { id: 'hospitals', label: 'Hospital Status' },
    { id: 'patients', label: 'Patient Vitals' },
    { id: 'alerts', label: 'Emergency Alerts' },
    { id: 'supplies', label: 'Medical Supplies' },
];

const AmbulanceOverview = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em' }}>Emergency Response</h1>
            <p style={{ color: '#666' }}>Patient transport and critical care management.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <StatCard label="Response Time" value="8m" subtext="Average" trend="Optimal" />
            <StatCard label="Oxygen Level" value="95%" subtext="Tank Capacity" />
            <StatCard label="Route Status" value="Clear" subtext="Green Corridor Active" trend="Active" />
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
