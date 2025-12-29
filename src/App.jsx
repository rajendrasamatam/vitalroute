import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import LandingPage from './components/LandingPage/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';

import AdminDashboard from './components/Dashboards/AdminDashboard';
import AmbulanceDashboard from './components/Dashboards/AmbulanceDashboard';
import FireEngineDashboard from './components/Dashboards/FireEngineDashboard';
import DisasterDashboard from './components/Dashboards/DisasterDashboard';
import TrafficPoliceDashboard from './components/Dashboards/TrafficPoliceDashboard';
import TrafficInstallerDashboard from './components/Dashboards/TrafficInstallerDashboard';

// Global Loader Component
const GlobalLoader = () => (
  <div style={{
    height: '100vh',
    width: '100vw',
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontFamily: "'Oswald', sans-serif",
    zIndex: 9999
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '2px solid #333',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    <div style={{ fontSize: '1.2rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
      Initializing VITAL ROUTE
    </div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user profile to ensure we have role/status before rendering
        try {
          await getDoc(doc(db, "users", currentUser.uid));
        } catch (e) {
          console.error("Profile fetch error", e);
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboards - Protected Routes logic can be added here later */}
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
