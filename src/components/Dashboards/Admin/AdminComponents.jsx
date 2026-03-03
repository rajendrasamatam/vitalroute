import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { ROLES, USER_STATUS } from '../../../constants';

// --- SHARED STYLES ---
const pageHeaderStyle = {
    marginBottom: '40px'
};
const pageTitleStyle = {
    fontSize: '2rem', fontWeight: 400, marginBottom: '10px',
    letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)'
};
const listContainerStyle = {
    background: '#fff', borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
};
const itemStyle = {
    padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
};
const emptyStyle = {
    padding: '40px', textAlign: 'center', color: '#999', fontStyle: 'italic'
};

// --- EMERGENCY REQUESTS ---
export const EmergencyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fallback: If 'emergency_requests' doesn't exist yet, this will just return empty, which is correct dynamic behavior
        const q = query(collection(db, "emergency_requests"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(data);
            setLoading(false);
        }, (err) => {
            console.warn("Emergency fetch failed (likely collection missing)", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>Emergency Requests</h1>
                <p style={{ color: '#666' }}>Live incoming alerts from the public and automated systems.</p>
            </div>

            <div style={listContainerStyle}>
                {loading ? <div style={{ padding: '20px' }}>Loading...</div> :
                    requests.length === 0 ? <div style={emptyStyle}>No active emergency requests. System Nominal.</div> : (
                        requests.map(req => (
                            <div key={req.id} style={itemStyle}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#e74c3c' }}>{req.type || 'General Alert'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{req.location ? `${req.location.latitude}, ${req.location.longitude}` : 'Unknown Location'}</div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                    {req.timestamp?.seconds ? new Date(req.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                </div>
                            </div>
                        ))
                    )}
            </div>
        </div>
    );
};

// --- ACTIVE VEHICLES ---
export const ActiveVehicles = () => {
    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        // Fetch all users who are NOT 'installer' or 'admin' or 'disaster' (assuming simplified vehicle roles)
        // OR simply fetch all non-admin. Realistically 'Active Vehicles' implies Ambulance/Fire/Police.

        // Firestore 'in' query supports up to 10 items
        const q = query(collection(db, "users"), where("role", "in", ["ambulance", "fire", "police"]));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVehicles(data);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>Active Fleet</h1>
                <p style={{ color: '#666' }}>Monitoring all emergency response vehicles.</p>
            </div>

            <div style={listContainerStyle}>
                {vehicles.length === 0 ? <div style={emptyStyle}>No emergency vehicles registered.</div> : (
                    vehicles.map(v => (
                        <div key={v.id} style={itemStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: v.status === USER_STATUS.VERIFIED ? '#2ecc71' : '#ccc' }}></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{v.fullName || 'Unknown Unit'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'capitalize' }}>{v.role} Unit</div>
                                </div>
                            </div>
                            <div style={{ padding: '5px 10px', background: '#f4f4f4', borderRadius: '5px', fontSize: '0.8rem' }}>
                                {v.status || 'Offline'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- TRAFFIC SIGNALS ---
export const MakeTrafficSignals = () => {
    // Renamed to avoid confusion, 'TrafficSignals' exported below
    const [signals, setSignals] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "signals"), orderBy("installedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSignals(data);
        }, (err) => { console.warn("Signal fetch failed", err); });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>Junction Control</h1>
                <p style={{ color: '#666' }}>Status of all connected traffic signals.</p>
            </div>

            <div style={listContainerStyle}>
                {signals.length === 0 ? <div style={emptyStyle}>No signals installed yet.</div> : (
                    signals.map(s => (
                        <div key={s.id} style={itemStyle}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{s.lightId || 'Unnamed Signal'}</div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>Dir: {s.direction}°</div>
                            </div>
                            <span style={{
                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                background: s.status === 'working' ? '#dcfce7' : '#fee2e2',
                                color: s.status === 'working' ? '#166534' : '#991b1b'
                            }}>
                                {s.status || 'Unknown'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- SYSTEM LOGS ---
export const SystemLogs = () => {
    // Placeholder for logs (often high volume, might need limit)
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Try to fetch 'system_logs' or just return empty
        try {
            const q = query(collection(db, "system_logs"), orderBy("timestamp", "desc")); // limit handled by firestore rules or just default 50
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLogs(data);
            }, () => { }); // Ignore errors if collection missing
            return () => unsubscribe();
        } catch (e) { }
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>System Audit</h1>
                <p style={{ color: '#666' }}>Core system events and diagnostic logs.</p>
            </div>
            <div style={listContainerStyle}>
                {logs.length === 0 ? <div style={emptyStyle}>No logs available.</div> : (
                    logs.map(l => (
                        <div key={l.id} style={{ ...itemStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            <span style={{ color: '#555' }}>[{l.level || 'INFO'}]</span>
                            <span>{l.message}</span>
                            <span style={{ color: '#aaa' }}>{l.timestamp?.seconds}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- SETTINGS (Basic Profile placeholder) ---
export const AdminSettings = () => (
    <div style={{ animation: 'fadeIn 0.6s ease-out', textAlign: 'center', padding: '50px' }}>
        <h2>System Settings</h2>
        <p style={{ color: '#888' }}>Global system configuration parameters would go here.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#fff', borderRadius: '8px', display: 'inline-block' }}>
            <div>Version: 1.0.0 (Beta)</div>
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa' }}>VITAL ROUTE INC.</div>
        </div>
    </div>
);
