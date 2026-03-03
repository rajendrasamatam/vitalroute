import React, { useState } from 'react';
import GenericDashboard from './GenericDashboard';
import AmbulanceMission from './Ambulance/AmbulanceMission';
import AmbulanceRouteMap from './Ambulance/AmbulanceRouteMap';
import HospitalStatus from './Ambulance/HospitalStatus';
import PatientVitals from './Ambulance/PatientVitals';
import EmergencyAlerts from './Ambulance/EmergencyAlerts';
import MedicalSupplies from './Ambulance/MedicalSupplies';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const MENU_ITEMS = [
    { id: 'overview', label: 'Mission Control' },
    { id: 'map', label: 'Route Map' },
    { id: 'hospitals', label: 'Hospital Status' },
    { id: 'patients', label: 'Patient Vitals' },
    { id: 'alerts', label: 'Emergency Alerts' },
    { id: 'supplies', label: 'Medical Supplies' },
];

const AmbulanceDashboard = () => {
    // Helper to get present user for passing to Mission Control
    const currentUser = auth.currentUser;

    const renderCustomContent = (viewId) => {
        switch (viewId) {
            case 'overview':
                return <AmbulanceMission userProfile={currentUser} />;
            case 'map':
                return <AmbulanceRouteMap />;
            case 'hospitals':
                return <HospitalStatus />;
            case 'patients':
                return <PatientVitals />;
            case 'alerts':
                return <EmergencyAlerts />;
            case 'supplies':
                return <MedicalSupplies />;
            default:
                return <AmbulanceMission userProfile={currentUser} />;
        }
    };

    return (
        <GenericDashboard
            roleTitle="AMBULANCE UNIT"
            roleId="ambulance"
            menuItems={MENU_ITEMS}
            OverviewComponent={() => <AmbulanceMission userProfile={currentUser} />}
            statusColor="#e74c3c"
            renderCustomContent={renderCustomContent}
        />
    );
};

export default AmbulanceDashboard;
