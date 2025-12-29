import React from 'react';

const MENU_ITEMS = [
    { id: 'overview', label: 'Dashboard Overview' },
    { id: 'map', label: 'Live Traffic Map' },
    { id: 'requests', label: 'Emergency Requests' },
    { id: 'vehicles', label: 'Active Vehicles' },
    { id: 'signals', label: 'Traffic Signals & Junctions' },
    { id: 'corridor', label: 'Green Corridor Status' },
    { id: 'logs', label: 'System Logs & History' },
    { id: 'users', label: 'User & Role Management' },
    { id: 'settings', label: 'Settings' },
];

const AdminSidebar = ({ isOpen, activeView, onSelect, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 99,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.4s ease'
                }}
            />

            {/* Sidebar Panel */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '300px',
                height: '100vh',
                background: '#fff',
                zIndex: 100,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth "Anti-Gravity" ease
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '10px 0 30px rgba(0,0,0,0.05)'
            }}>
                {/* Header */}
                <div style={{ padding: '40px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.5rem',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        color: '#000'
                    }}>
                        VITAL ROUTE
                    </h2>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Admin Console
                    </p>
                </div>

                {/* Menu Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
                    {MENU_ITEMS.map(item => (
                        <div
                            key={item.id}
                            onClick={() => {
                                onSelect(item.id);
                                onClose(); // Optional: close on select for mobile feel, or keep open
                            }}
                            className="menu-item-hover"
                            style={{
                                padding: '15px 40px',
                                cursor: 'pointer',
                                color: activeView === item.id ? '#000' : '#888',
                                background: activeView === item.id ? '#f4f4f4' : 'transparent',
                                fontSize: '1rem',
                                fontWeight: activeView === item.id ? 600 : 400,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                borderLeft: activeView === item.id ? '3px solid #000' : '3px solid transparent'
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>

                {/* Footer / Logout */}
                <div style={{ padding: '40px', borderTop: '1px solid #f0f0f0' }}>
                    <div
                        onClick={() => onSelect('logout')}
                        style={{
                            cursor: 'pointer',
                            color: '#e74c3c', // Subtle warning color
                            fontSize: '1rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        Logout
                    </div>
                </div>
            </div>

            <style>{`
                .menu-item-hover:hover {
                    color: #000 !important;
                    background: #f9f9f9 !important;
                    padding-left: 45px !important; /* Subtle shift */
                }
            `}</style>
        </>
    );
};

export default AdminSidebar;
