import React from 'react';

const AdminTopBar = ({ onMenuClick, userProfile }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            zIndex: 90,
            borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
            {/* Left: Hamburger + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                    <span style={{ width: '16px', height: '2px', background: '#000', borderRadius: '2px' }}></span> {/* Uneven line for style */}
                </button>
                
                <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 600, 
                    letterSpacing: '-0.01em',
                    opacity: 0.4
                }}>
                    COMMAND CENTER
                </span>
            </div>

            {/* Right: Profile & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#2ecc71',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #2ecc71'
                    }}></span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#000', letterSpacing: '0.05em' }}>
                        SYSTEM ACTIVE
                    </span>
                </div>

                <div style={{ width: '1px', height: '30px', background: '#ddd' }}></div>

                {/* Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#000' }}>
                            {userProfile?.fullName || 'Administrator'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>
                            {userProfile?.role || 'Super Admin'}
                        </div>
                    </div>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#000',
                        overflow: 'hidden',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        {userProfile?.profileImage ? (
                            <img src={userProfile.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>A</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTopBar;
