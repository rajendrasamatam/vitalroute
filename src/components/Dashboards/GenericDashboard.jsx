import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import DashboardTopBar from './Shared/DashboardTopBar';
import DashboardSidebar from './Shared/DashboardSidebar';

// Access Denied Components
const AccessScreen = ({ title, message, color }) => (
    <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f4f4',
        fontFamily: "'Inter', sans-serif"
    }}>
        <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%'
        }}>
            <div style={{
                width: '60px', height: '60px', borderRadius: '50%', background: color, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff'
            }}>!</div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#111' }}>{title}</h1>
            <p style={{ color: '#666', lineHeight: 1.6 }}>{message}</p>
            <div style={{ marginTop: '30px', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                System Monitoring Active
            </div>
            <button
                onClick={() => auth.signOut()}
                style={{
                    marginTop: '30px',
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    background: 'transparent',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </div>
    </div>
);

const GenericDashboard = ({
    roleTitle,
    roleId,
    menuItems,
    OverviewComponent,
    statusText = "SYSTEM ACTIVE",
    statusColor = "#2ecc71",
    ...props
}) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('overview');
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Real-time subscription to user document
                const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserProfile(data);
                    } else {
                        // User exists in Auth but not in Firestore? Should verify logic/User Management creation.
                        console.error("User document not found.");
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore Listen Error:", error);
                    setLoading(false);
                });

                return () => unsubscribeDoc();
            } else {
                navigate('/');
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    const handleMenuClick = (id) => {
        if (id === 'logout') {
            auth.signOut().then(() => navigate('/', { replace: true }));
        } else {
            setActiveView(id);
        }
    };

    const renderContent = () => {
        if (activeView === 'overview') {
            return <OverviewComponent />;
        }

        if (props.renderCustomContent) {
            const custom = props.renderCustomContent(activeView);
            if (custom) return custom;
        }

        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', marginTop: '100px' }}>
                <h1>{activeView.charAt(0).toUpperCase() + activeView.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h1>
                <p>This module is under development.</p>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #ddd', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ACCESS CONTROL GATES //
    if (userProfile?.status === 'pending') {
        return <AccessScreen
            title="Account Under Review"
            message="Your profile is currently waiting for administrator approval. Once verified, you will automatically gain access to this dashboard."
            color="#f39c12"
        />;
    }

    if (userProfile?.status === 'suspended') {
        return <AccessScreen
            title="Access Suspended"
            message="Your account has been temporarily suspended by an administrator. Please contact IT support or your supervisor."
            color="#e74c3c"
        />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F4F4F4',
            fontFamily: "'Inter', sans-serif"
        }}>
            <DashboardTopBar
                onMenuClick={() => setSidebarOpen(true)}
                userProfile={userProfile}
                title={roleTitle}
                statusText={statusText}
                statusColor={statusColor}
            />

            <DashboardSidebar
                isOpen={isSidebarOpen}
                activeView={activeView}
                onSelect={handleMenuClick}
                onClose={() => setSidebarOpen(false)}
                title="VITAL ROUTE"
                subtitle={`${roleTitle} Console`}
                menuItems={menuItems}
                footerItem={{ label: 'Logout', onClick: () => handleMenuClick('logout') }}
            />

            <main className="dashboard-main" style={{
                transition: 'filter 0.3s',
                filter: isSidebarOpen ? 'blur(2px)' : 'none',
                minHeight: '100vh'
            }}>
                {renderContent()}
            </main>

            <style>{`
                .dashboard-main {
                    padding: 100px 40px 40px 40px;
                }
                @media (max-width: 768px) {
                    .dashboard-main {
                        padding: 80px 20px 20px 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default GenericDashboard;
