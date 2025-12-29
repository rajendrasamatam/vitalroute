import React from 'react';

const DashboardTopBar = ({ onMenuClick, title, userProfile, statusText = "SYSTEM ACTIVE", statusColor = "#2ecc71" }) => {
    return (
        <div className="dashboard-topbar">
            {/* Left: Hamburger + Title */}
            <div className="topbar-left">
                <button
                    onClick={onMenuClick}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '10px'
                    }}
                >
                    <span style={{ width: '24px', height: '2px', background: '#000', borderRadius: '2px' }}></span>
                    <span style={{ width: '24px', height: '2px', background: '#000', borderRadius: '2px' }}></span>
                    <span style={{ width: '16px', height: '2px', background: '#000', borderRadius: '2px' }}></span>
                </button>

                <span className="topbar-title">
                    {title}
                </span>
            </div>

            {/* Right: Profile & Status */}
            <div className="topbar-right">
                {/* Status Indicator */}
                <div className="status-indicator">
                    <span style={{
                        width: '8px',
                        height: '8px',
                        background: statusColor,
                        borderRadius: '50%',
                        boxShadow: `0 0 10px ${statusColor}`
                    }}></span>
                    <span className="status-text">
                        {statusText}
                    </span>
                </div>

                <div className="divider" style={{ width: '1px', height: '30px', background: '#ddd' }}></div>

                {/* Profile */}
                <div className="profile-section">
                    <div className="profile-info">
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#000' }}>
                            {userProfile?.fullName || 'User'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>
                            {userProfile?.role || 'Member'}
                        </div>
                    </div>
                    <div className="profile-avatar">
                        {userProfile?.profileImage ? (
                            <img src={userProfile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                {userProfile?.fullName ? userProfile.fullName.charAt(0) : 'U'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-topbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 40px;
                    z-index: 90;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .topbar-left, .topbar-right {
                    display: flex;
                    align-items: center;
                }
                .topbar-left { gap: 20px; }
                .topbar-right { gap: 30px; }
                
                .topbar-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    opacity: 0.4;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .status-text {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #000;
                    letter-spacing: 0.05em;
                }

                .profile-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .profile-info { text-align: right; }
                .profile-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #000;
                    overflow: hidden;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .dashboard-topbar {
                        padding: 0 20px;
                        height: 70px;
                    }
                    .topbar-left { gap: 10px; }
                    .topbar-right { gap: 10px; }
                    
                    .topbar-title {
                        font-size: 0.9rem;
                        max-width: 100px;
                    }

                    .status-text, .profile-info, .divider {
                        display: none;
                    }
                    
                    /* Keep status dot but hide text */
                    .status-indicator { gap: 0; }
                }
            `}</style>
        </div>
    );
};

export default DashboardTopBar;

