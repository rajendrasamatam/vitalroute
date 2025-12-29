import React from 'react';
import DashboardLayout from './DashboardLayout';

const FireEngineDashboard = () => {
    return (
        <DashboardLayout title="Fire Response Unit" role="Fire Engine Driver">
            <button style={{
                padding: '20px 40px',
                background: '#ff6600',
                color: '#fff',
                fontSize: '1.2rem',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 10px 20px rgba(255, 102, 0, 0.3)'
            }}>
                DEPLOY CORRIDOR
            </button>
        </DashboardLayout>
    );
};

export default FireEngineDashboard;
