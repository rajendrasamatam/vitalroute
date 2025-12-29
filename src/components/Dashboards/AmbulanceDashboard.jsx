import React from 'react';
import DashboardLayout from './DashboardLayout';

const AmbulanceDashboard = () => {
    return (
        <DashboardLayout title="Emergency Response Unit" role="Ambulance Driver">
            <button style={{
                padding: '20px 40px',
                background: '#ff3333',
                color: '#fff',
                fontSize: '1.2rem',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(255, 51, 51, 0.3)'
            }}>
                ACTIVATE EMERGENCY MODE
            </button>
        </DashboardLayout>
    );
};

export default AmbulanceDashboard;
