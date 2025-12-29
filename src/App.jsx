import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';

import AdminDashboard from './components/Dashboards/AdminDashboard';
import AmbulanceDashboard from './components/Dashboards/AmbulanceDashboard';
import FireEngineDashboard from './components/Dashboards/FireEngineDashboard';
import DisasterDashboard from './components/Dashboards/DisasterDashboard';
import TrafficPoliceDashboard from './components/Dashboards/TrafficPoliceDashboard';
import TrafficInstallerDashboard from './components/Dashboards/TrafficInstallerDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboards */}
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/ambulance" element={<AmbulanceDashboard />} />
        <Route path="/dashboard/fire" element={<FireEngineDashboard />} />
        <Route path="/dashboard/disaster" element={<DisasterDashboard />} />
        <Route path="/dashboard/police" element={<TrafficPoliceDashboard />} />
        <Route path="/dashboard/installer" element={<TrafficInstallerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
