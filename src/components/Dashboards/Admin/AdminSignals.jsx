import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp.seconds * 1000).toLocaleString();
};

const AdminSignals = () => {
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "signals"), orderBy("installedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSignals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching signals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#636e72' }}>Loading signals...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#2d3436' }}>Traffic Signals Registry</h2>
                <div style={{ background: '#e3f2fd', color: '#0984e3', padding: '5px 15px', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem' }}>
                    Total: {signals.length}
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #edeff0' }}>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>SERIAL ID</th>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>LOCATION</th>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>DIRECTION</th>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>STATUS</th>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>INSTALLED AT</th>
                            <th style={{ padding: '15px', color: '#636e72', fontWeight: '600', fontSize: '0.9rem' }}>REGISTERED BY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {signals.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#b2bec3' }}>
                                    No traffic signals registered yet.
                                </td>
                            </tr>
                        ) : (
                            signals.map((signal) => (
                                <tr key={signal.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                                    <td style={{ padding: '15px', fontWeight: '600', color: '#2d3436' }}>
                                        {signal.lightId || '—'}
                                    </td>
                                    <td style={{ padding: '15px', fontFamily: 'monospace', color: '#636e72' }}>
                                        {signal.location ? `${signal.location.latitude.toFixed(5)}, ${signal.location.longitude.toFixed(5)}` : 'N/A'}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ transform: `rotate(${signal.direction || 0}deg)`, display: 'inline-block', fontSize: '1.2rem', color: '#0984e3' }}>
                                                ➤
                                            </span>
                                            {signal.direction}°
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase',
                                            background: signal.status === 'working' ? '#d5f5e3' : '#fadbd8',
                                            color: signal.status === 'working' ? '#2ecc71' : '#e74c3c'
                                        }}>
                                            {signal.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', color: '#636e72', fontSize: '0.9rem' }}>
                                        {formatDate(signal.installedAt)}
                                    </td>
                                    <td style={{ padding: '15px', color: '#636e72', fontSize: '0.9rem' }}>
                                        {signal.registeredBy || 'Unknown System'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSignals;
