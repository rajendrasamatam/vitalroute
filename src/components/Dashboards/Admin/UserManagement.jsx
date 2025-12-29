import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const ROLES = [
    { id: 'admin', label: 'Admin' },
    { id: 'ambulance', label: 'Ambulance' },
    { id: 'fire', label: 'Fire Engine' },
    { id: 'disaster', label: 'Disaster Ops' },
    { id: 'police', label: 'Traffic Police' },
    { id: 'installer', label: 'Installer' },
];

const StatusBadge = ({ status }) => {
    let color = '#888';
    let bg = '#eee';
    let label = status || 'unknown';

    switch (status) {
        case 'verified':
            color = '#166534';
            bg = '#dcfce7';
            break;
        case 'pending':
            color = '#b45309';
            bg = '#fef3c7';
            label = 'Needs Verification';
            break;
        case 'suspended':
            color = '#991b1b';
            bg = '#fee2e2';
            break;
        default:
            break;
    }

    return (
        <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: color,
            background: bg,
            display: 'inline-block'
        }}>
            {label}
        </span>
    );
};

const UserRow = ({ user, onAction }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="user-row"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsHovered(!isHovered)} // Toggle for mobile
        >
            {/* Avatar */}
            <div className="user-avatar">
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: '#eee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888',
                    fontSize: '1rem', fontWeight: 600, overflow: 'hidden'
                }}>
                    {user.profileImage ? (
                        <img src={user.profileImage} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        (user.fullName || 'U').charAt(0)
                    )}
                </div>
            </div>

            {/* Name & Email */}
            <div className="user-info">
                <div style={{ fontWeight: 600, color: '#111' }}>{user.fullName || 'Unknown User'}</div>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>{user.email}</div>
            </div>

            {/* Role */}
            <div className="user-role" style={{ color: '#555', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                {ROLES.find(r => r.id === user.role)?.label || user.role}
            </div>

            {/* Status */}
            <div className="user-status">
                <StatusBadge status={user.status} />
            </div>

            {/* Empty Spacer */}
            <div className="spacer"></div>

            {/* Actions */}
            <div className="user-actions" style={{
                opacity: isHovered ? 1 : 0,
            }}>
                {(user.status === 'pending' || !user.status) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(user.uid, 'verify'); }}
                        style={{ ...actionBtnStyle, background: '#000', color: '#fff' }}>
                        Verify
                    </button>
                )}
                {user.status !== 'suspended' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(user.uid, 'suspend'); }}
                        style={{ ...actionBtnStyle, border: '1px solid #ddd', color: '#555' }}>
                        Suspend
                    </button>
                )}
                {user.status === 'suspended' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(user.uid, 'verify'); }}
                        style={{ ...actionBtnStyle, border: '1px solid #ddd', color: '#166534' }}>
                        Reactivate
                    </button>
                )}
            </div>
        </div>
    );
};

const actionBtnStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    transition: 'background 0.2s'
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to real-time updates from Firestore
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userList = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setUsers(userList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAction = async (uid, action) => {
        try {
            const userRef = doc(db, "users", uid);
            let updateData = {};

            if (action === 'verify') updateData = { status: 'verified' };
            if (action === 'suspend') updateData = { status: 'suspended' };

            await updateDoc(userRef, updateData);
        } catch (err) {
            console.error("Error updating user status:", err);
            alert("Failed to update user status.");
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out', paddingBottom: '40px' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 400, marginBottom: '10px', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>User Control</h1>
                    <p style={{ color: '#666' }}>Manage access permissions and verification status.</p>
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 200, color: '#ddd' }}>
                    {users.length} <span style={{ fontSize: '1rem', color: '#888' }}>USERS</span>
                </div>
            </div>

            {/* Table Header - Hide on Mobile */}
            <div className="table-header" style={{
                display: 'grid',
                gridTemplateColumns: '60px 2fr 1.5fr 1.5fr 1fr 1.5fr',
                padding: '0 20px 15px',
                color: '#888',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600
            }}>
                <div></div>
                <div>User Details</div>
                <div>Assigned Role</div>
                <div>Status</div>
                <div></div>
                <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* List */}
            <div>
                {users.map(user => (
                    <UserRow key={user.uid} user={user} onAction={handleAction} />
                ))}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .user-row {
                    display: grid;
                    grid-template-columns: 60px 2fr 1.5fr 1.5fr 1fr 1.5fr;
                    align-items: center;
                    padding: 20px;
                    background: #fff;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                    cursor: default;
                }

                .user-row:hover {
                    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
                    transform: scale(1.005);
                }

                .user-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    transition: opacity 0.2s;
                }

                @media (max-width: 900px) {
                     .user-row {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        position: relative;
                        padding-bottom: 70px; /* Space for actions */
                    }
                    .table-header { display: none !important; }
                    
                    /* Avatar & Info Container */
                    .user-avatar {
                        margin-bottom: 10px;
                    }

                    .user-info {
                        width: 100%;
                        padding-right: 90px; /* Space for absolute badge */
                        margin-bottom: 5px;
                    }
                    
                    /* Role below info */
                    .user-role {
                        font-size: 0.85rem;
                        color: #666;
                        background: #f9f9f9;
                        padding: 4px 10px;
                        border-radius: 4px;
                        margin-bottom: 10px;
                        display: inline-block;
                    }

                    /* Absolute Badge Top Right */
                    .user-status {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        text-align: right;
                    }

                    .spacer { display: none; }
                    
                    /* Full width actions at bottom */
                    .user-actions {
                        position: absolute;
                        bottom: 15px;
                        left: 20px;
                        right: 20px;
                        justify-content: stretch;
                        opacity: 1 !important;
                        border-top: 1px solid #f0f0f0;
                        padding-top: 15px;
                        gap: 10px;
                    }
                    .user-actions button {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
