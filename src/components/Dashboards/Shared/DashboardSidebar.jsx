import React from 'react';

const DashboardSidebar = ({ isOpen, activeView, onSelect, onClose, title, subtitle, menuItems, footerItem }) => {
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
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
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
                        {title || 'VITAL ROUTE'}
                    </h2>
                    <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {subtitle || 'Console'}
                    </p>
                </div>

                {/* Menu Items */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => {
                                onSelect(item.id);
                                onClose();
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
                {footerItem && (
                    <div style={{ padding: '40px', borderTop: '1px solid #f0f0f0' }}>
                        <div
                            onClick={footerItem.onClick}
                            style={{
                                cursor: 'pointer',
                                color: footerItem.color || '#e74c3c',
                                fontSize: '1rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            {footerItem.label}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .menu-item-hover:hover {
                    color: #000 !important;
                    background: #f9f9f9 !important;
                    padding-left: 45px !important;
                }
            `}</style>
        </>
    );
};

export default DashboardSidebar;
