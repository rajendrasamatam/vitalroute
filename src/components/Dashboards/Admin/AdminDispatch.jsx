import React, { useState, useEffect } from 'react';
import { db, database } from '../../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { ref as dbRef, onValue, update as dbUpdate } from 'firebase/database';
import { USER_STATUS } from '../../../constants';

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
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    marginBottom: '30px'
};
const itemStyle = {
    padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
};
const emptyStyle = {
    padding: '40px', textAlign: 'center', color: '#999', fontStyle: 'italic'
};
const priorityColors = {
    red: { bg: '#fee2e2', text: '#ef4444', border: '#f87171' },
    yellow: { bg: '#fef3c7', text: '#f59e0b', border: '#fbbf24' },
    blue: { bg: '#e0f2fe', text: '#3b82f6', border: '#7dd3fc' }
};

// --- GEO-MATH UTILITY ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Google Maps Setup
import { useLoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '12px', marginBottom: '20px' };
const defaultCenter = { lat: 17.3850, lng: 78.4867 };

const AdminDispatch = () => {
    // Google Maps Loader
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";
    const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries });

    const [availableUnits, setAvailableUnits] = useState([]);
    const [liveLocations, setLiveLocations] = useState({});
    const [recentTasks, setRecentTasks] = useState([]);

    // Filtering & Map State
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const [incidentLocation, setIncidentLocation] = useState(defaultCenter);
    const [autocompleteInfo, setAutocompleteInfo] = useState(null);

    // Rapid Dispatch State
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [locationNote, setLocationNote] = useState('');
    const [isDispatching, setIsDispatching] = useState(false);

    // 1. Fetch Online Units (Firestore)
    useEffect(() => {
        const q = query(
            collection(db, "users"),
            where("role", "in", ["ambulance", "fire", "police"]),
            where("availability", "==", "online")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailableUnits(data);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch Live Coordinates (RTDB)
    useEffect(() => {
        const ambulancesRef = dbRef(database, 'ambulances');
        const unsubscribe = onValue(ambulancesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const locations = {};
                Object.keys(data).forEach(key => {
                    locations[key] = {
                        lat: Number(data[key].location?.lat || 0),
                        lng: Number(data[key].location?.lng || 0)
                    };
                });
                setLiveLocations(locations);
            } else {
                setLiveLocations({});
            }
        });
        return () => unsubscribe();
    }, []);

    // 3. Fetch Recent Dispatches (Operator Sourced)
    useEffect(() => {
        const q = query(
            collection(db, "emergency_requests"),
            where("source", "==", "operator_dispatch"),
            orderBy("timestamp", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentTasks(data);
        });
        return () => unsubscribe();
    }, []);

    const handlePlaceChanged = () => {
        if (autocompleteInfo !== null) {
            const place = autocompleteInfo.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setIncidentLocation({ lat, lng });
                // Automatically populate the location note with the searched address if empty
                setLocationNote(place.formatted_address || place.name || '');
            } else {
                console.log("No geometry available for this place");
            }
        }
    };

    const handleRapidDispatch = async (priority) => {
        if (!selectedUnit) return;
        setIsDispatching(true);

        const unitUid = selectedUnit.uid || selectedUnit.id;
        const displayName = `${selectedUnit.fullName || 'Unknown Unit'} (${unitUid})`;

        try {
            // 1. Create the Emergency Request Record
            await addDoc(collection(db, "emergency_requests"), {
                type: selectedUnit.role,
                priority: priority,
                locationNote: locationNote.trim(),
                status: 'dispatched',
                assignedTo: selectedUnit.id,
                uid: unitUid, // Explicitly include the uid
                assignedUnitName: displayName,
                timestamp: serverTimestamp(),
                source: 'operator_dispatch',
                incidentLat: incidentLocation.lat,
                incidentLng: incidentLocation.lng
            });

            // 2. Mark Unit as Busy in Firestore so they drop off the "Online Units" list instantly
            await updateDoc(doc(db, "users", selectedUnit.id), {
                availability: 'busy' // or 'on_mission'
            });

            // 3. Update Realtime Database (RTDB) so Live Map instantly draws the active route/colored aura
            await dbUpdate(dbRef(database, `ambulances/${selectedUnit.id}`), {
                status: 'on_mission',
                priority: priority,
                type: selectedUnit.role,
                'location/destLat': incidentLocation.lat,
                'location/destLng': incidentLocation.lng
            });

            // 4. Update local 'recentTasks' for instant UI feedback
            setRecentTasks(prev => [{
                id: Date.now(),
                unitName: selectedUnit.fullName,
                priority: priority,
                time: new Date().toLocaleTimeString()
            }, ...prev]);

            setSelectedUnit(null);
            setLocationNote('');
        } catch (error) {
            console.error("Dispatch Failed:", error);
            alert("Failed to assign task. Please check system connection.");
        }
        setIsDispatching(false);
    };

    // --- FILTER & SORT UNITS ---
    const processedUnits = availableUnits
        .filter(unit => selectedRoleFilter === 'all' || unit.role === selectedRoleFilter)
        .map(unit => {
            let distance = null;
            if (liveLocations[unit.id] && liveLocations[unit.id].lat) {
                distance = getDistance(
                    incidentLocation.lat, incidentLocation.lng,
                    liveLocations[unit.id].lat, liveLocations[unit.id].lng
                );
            }
            return {
                ...unit,
                distance: distance
            };
        })
        .sort((a, b) => {
            // Units with a known distance come first
            if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
            if (a.distance !== null) return -1;
            if (b.distance !== null) return 1;
            return 0;
        });


    return (
        <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>Rapid Dispatch</h1>
                <p style={{ color: '#666' }}>Instantly assign emergency tasks to available online units.</p>
            </div>

            {/* INTERACTIVE EMERGENCY LOCATION MAP */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>1. Set Emergency Location</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>Click on the map or search for a landmark to place the incident epicenter.</p>
                {loadError ? (
                    <div style={{ padding: '20px', color: 'red' }}>Map Error: {loadError.message}</div>
                ) : !isLoaded ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading Interactive Map...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Autocomplete
                            onLoad={(autoC) => setAutocompleteInfo(autoC)}
                            onPlaceChanged={handlePlaceChanged}
                        >
                            <input
                                type="text"
                                placeholder="Search for location or landmark..."
                                style={{
                                    boxSizing: 'border-box',
                                    border: '1px solid #ccc',
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    textOverflow: 'ellipses',
                                    marginBottom: '10px'
                                }}
                            />
                        </Autocomplete>

                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={12}
                            center={incidentLocation} // dynamically center to the searched location
                            options={{ disableDefaultUI: true, zoomControl: true, styles: [] }}
                            onClick={(e) => setIncidentLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                        >
                            <Marker
                                position={incidentLocation}
                                icon={{
                                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                }}
                            />
                        </GoogleMap>
                    </div>
                )}

                <div style={{ fontSize: '0.85rem', color: '#888', background: '#f8f9fa', padding: '10px', borderRadius: '8px', display: 'inline-block', marginTop: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>Selected Epicenter:</span> {incidentLocation.lat.toFixed(4)}, {incidentLocation.lng.toFixed(4)}
                </div>
            </div>

            {/* RECENT DISPATCHES (Instant Feedback) */}
            {recentTasks.length > 0 && (
                <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 10px 0', color: '#0f172a' }}>Latest Dispatches</h3>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                        {recentTasks.slice(0, 3).map(task => (
                            <div key={task.id} style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', whiteSpace: 'nowrap', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: task.priority === 'red' ? '#ef4444' : task.priority === 'yellow' ? '#f59e0b' : '#3b82f6', fontWeight: 'bold' }}>• {task.priority.toUpperCase()}</span>
                                <span style={{ marginLeft: '8px', fontWeight: 600 }}>{task.unitName}</span>
                                <span style={{ marginLeft: '8px', color: '#94a3b8' }}>{task.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FILTER CONTROLS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['all', 'ambulance', 'fire', 'police'].map(role => (
                    <button
                        key={role}
                        onClick={() => setSelectedRoleFilter(role)}
                        style={{
                            padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd',
                            background: selectedRoleFilter === role ? '#111' : '#fff',
                            color: selectedRoleFilter === role ? '#fff' : '#333',
                            cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize', fontSize: '0.9rem'
                        }}
                    >
                        {role === 'all' ? 'All Roles' : role}
                    </button>
                ))}
            </div>

            {/* AVAILABLE UNITS GRID */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Online Units near Epicenter ({processedUnits.length})</h2>
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px'
            }}>
                {processedUnits.length === 0 ? (
                    <div style={{ ...listContainerStyle, gridColumn: '1 / -1' }}>
                        <div style={emptyStyle}>No active response units match the criteria.</div>
                    </div>
                ) : (
                    processedUnits.map(unit => {
                        const unitUid = unit.uid || unit.id;
                        return (
                            <div key={unit.id} style={{
                                background: '#fff', padding: '20px', borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px',
                                borderTop: `4px solid ${unit.role === 'ambulance' ? '#ef4444' : unit.role === 'fire' ? '#f97316' : '#3b82f6'} `
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>
                                        {unit.fullName || 'Unnamed Unit'} <span style={{ fontSize: '0.8rem', color: '#888' }}>({unitUid.slice(0, 6)})</span>
                                    </h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', textTransform: 'capitalize', background: '#f0f0f0', padding: '3px 8px', borderRadius: '4px' }}>
                                            {unit.role}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>
                                            {unit.distance !== null ? `${unit.distance.toFixed(1)} km away` : 'Location Unknown'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedUnit(unit)}
                                    style={{
                                        padding: '12px', background: '#111', color: '#fff', border: 'none',
                                        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                                    }}
                                >
                                    DISPATCH UNIT
                                </button>
                            </div>
                        )
                    }
                    )
                )}
            </div>

            {/* RECENT DISPATCHES TABLE */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Active System Tasks</h2>
            <div style={listContainerStyle}>
                {recentTasks.length === 0 ? <div style={emptyStyle}>No tasks assigned via operator today.</div> : (
                    recentTasks.map(task => {
                        const colors = priorityColors[task.priority] || priorityColors.blue;
                        return (
                            <div key={task.id} style={itemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border} `,
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase'
                                    }}>
                                        {task.priority ? task.priority.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{task.assignedUnitName}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            Note: {task.locationNote || 'No location details provided'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                        background: task.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                                        color: task.status === 'completed' ? '#166534' : '#475569'
                                    }}>
                                        {task.status || 'Active'}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                        {task.timestamp?.seconds ? new Date(task.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* RAPID DISPATCH MODAL OVERLAY */}
            {selectedUnit && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '500px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>Assign to {selectedUnit.fullName}</h2>
                            <button
                                onClick={() => setSelectedUnit(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}
                            >×</button>
                        </div>

                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Select the emergency priority to instantly dispatch this unit.
                        </p>

                        <div style={{ marginBottom: '25px' }}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Rough location / landmark (Optional)"
                                value={locationNote}
                                onChange={(e) => setLocationNote(e.target.value)}
                                style={{
                                    width: '100%', padding: '15px', borderRadius: '10px',
                                    border: '2px solid #e5e7eb', fontSize: '1rem', outline: 'none',
                                    transition: 'border-color 0.2s', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                            <button
                                disabled={isDispatching}
                                onClick={() => handleRapidDispatch('red')}
                                style={{
                                    padding: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    background: '#ef4444', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <span>🟥 CRITICAL (RED)</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Life Threatening</span>
                            </button>

                            <button
                                disabled={isDispatching}
                                onClick={() => handleRapidDispatch('yellow')}
                                style={{
                                    padding: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    background: '#f59e0b', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <span>🟨 URGENT (YELLOW)</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Requires Speed</span>
                            </button>

                            <button
                                disabled={isDispatching}
                                onClick={() => handleRapidDispatch('blue')}
                                style={{
                                    padding: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    background: '#3b82f6', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <span>🟦 NON-CRITICAL (BLUE)</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Routine Assignment</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
@keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
}
`}</style>
        </div>
    );
};

export default AdminDispatch;
