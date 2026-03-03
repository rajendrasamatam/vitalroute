import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLoadScript, GoogleMap, DrawingManager, Polygon, Circle, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteField } from 'firebase/firestore';
import { Trash2, MapPin, AlertCircle, CheckSquare, Square, ChevronDown, ChevronRight, Activity, Disc, Ruler, Eye, EyeOff, Search } from 'lucide-react';

const libraries = ['places', 'drawing'];

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
};

const defaultCenter = {
    lat: 17.3850,
    lng: 78.4867
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    rotateControl: true,
    clickableIcons: false
};

const getLatLng = (loc) => {
    if (!loc) return null;
    const lat = loc.lat || loc.latitude;
    const lng = loc.lng || loc.longitude;
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return null;
};

const JunctionItem = ({ junction, isSelected, onClick, signals, activeItem, onSelectItem }) => {

    return (
        <div style={{ borderBottom: '1px solid #f3f4f6', background: isSelected ? '#eff6ff' : '#fff' }}>
            <div
                onClick={() => onClick(junction)}
                style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.2s'
                }}
            >
                <div>
                    <div style={{ fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {junction.name || 'Unnamed Junction'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '2px' }}>
                        {junction.id}
                    </div>
                </div>
                {isSelected ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#9ca3af" />}
            </div>

            {/* Selection List */}
            {isSelected && (
                <div style={{ padding: '0 20px 16px 20px', background: '#eff6ff' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#60a5fa', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Select Item to Configure
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                        {/* 1. Junction Circle Option */}
                        <div
                            onClick={(e) => { e.stopPropagation(); onSelectItem({ type: 'junction', id: 'junction-circle', label: 'Junction Circle' }); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                fontSize: '0.85rem', color: activeItem?.type === 'junction' ? '#fff' : '#374151',
                                cursor: 'pointer', padding: '10px',
                                background: activeItem?.type === 'junction' ? '#f97316' : '#fff',
                                borderRadius: '6px',
                                border: activeItem?.type === 'junction' ? '1px solid #ea580c' : '1px solid #dbeafe',
                                transition: 'all 0.2s',
                                boxShadow: activeItem?.type === 'junction' ? '0 2px 4px rgba(249, 115, 22, 0.2)' : 'none'
                            }}
                        >
                            <Disc size={16} color={activeItem?.type === 'junction' ? '#fff' : '#f97316'} />
                            <div style={{ flex: 1, fontWeight: activeItem?.type === 'junction' ? 600 : 500 }}>Junction Exit Circle</div>
                            {junction.junctionCircle && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: 5 }} title="Configured" />
                            )}
                            <div style={{ fontSize: '0.7rem', background: activeItem?.type === 'junction' ? 'rgba(255,255,255,0.2)' : '#fff7ed', color: activeItem?.type === 'junction' ? '#fff' : '#c2410c', padding: '2px 6px', borderRadius: '4px' }}>
                                Circle
                            </div>
                        </div>

                        {/* 2. Divider */}
                        <div style={{ height: 1, background: '#dbeafe', margin: '4px 0' }} />

                        {/* 3. Signal Options */}
                        {signals.map(sig => {
                            const isActive = activeItem?.type === 'signal' && activeItem?.data?.id === sig.id;
                            const hasGeofence = !!sig.geofence;
                            return (
                                <div key={sig.id}
                                    onClick={(e) => { e.stopPropagation(); onSelectItem({ type: 'signal', data: sig }); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        fontSize: '0.85rem', color: isActive ? '#fff' : '#374151',
                                        cursor: 'pointer', padding: '8px 10px',
                                        background: isActive ? '#3b82f6' : '#fff',
                                        borderRadius: '6px',
                                        border: isActive ? '1px solid #2563eb' : '1px solid #dbeafe',
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: 14, height: 14, borderRadius: '50%', border: '2px solid',
                                        borderColor: isActive ? '#fff' : '#d1d5db',
                                        background: isActive ? '#fff' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />}
                                    </div>

                                    <div style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{sig.lightId || sig.id}</div>

                                    {hasGeofence && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} title="Configured" />
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.7rem', background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6', color: isActive ? '#fff' : '#6b7280', padding: '2px 6px', borderRadius: '4px', marginLeft: 5 }}>
                                        Polygon
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const GeofencingManagement = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyB7eG4ZV8A2dNItIjFkRyGUact3IstWwdY";
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [junctions, setJunctions] = useState([]);
    const [signals, setSignals] = useState([]);
    const [combinedData, setCombinedData] = useState([]);
    const [searchQuery, setSearchQuery] = useState(""); // Add search state

    const [selectedJunctionId, setSelectedJunctionId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);
    const activeItemRef = useRef(activeItem);

    // DRAWING TOGGLE STATE
    const [isDrawingMode, setIsDrawingMode] = useState(true);

    // VISUAL GUIDE STATE
    const [showVisualGuide, setShowVisualGuide] = useState(false);

    // Derived state
    const selectedJunctionData = selectedJunctionId ? combinedData.find(j => j.id === selectedJunctionId) : null;
    const selectedJunctionRef = useRef(selectedJunctionData);

    useEffect(() => {
        activeItemRef.current = activeItem;
        if (activeItem) {
            setShowVisualGuide(true); // Ensure guide is visible when selecting item to draw
            setIsDrawingMode(true); // Automatically enable drawing when an item is selected

            // Auto-pan and zoom closer when an item is selected for drawing
            if (activeItem.type === 'signal' && activeItem.data?.parsedLocation && mapRef.current) {
                mapRef.current.panTo(activeItem.data.parsedLocation);
                mapRef.current.setZoom(19); // Super close for drawing polygons
            } else if (activeItem.type === 'junction' && selectedJunctionData?.parsedLocation && mapRef.current) {
                mapRef.current.panTo(selectedJunctionData.parsedLocation);
                // Keep the current zoom or zoom a bit closer
                mapRef.current.setZoom(16);
            }
        }
    }, [activeItem, selectedJunctionData]);


    useEffect(() => {
        selectedJunctionRef.current = selectedJunctionData;
        if (selectedJunctionId) {
            setShowVisualGuide(true); // Show guide on junction select
        } else {
            setShowVisualGuide(false);
        }
    }, [selectedJunctionData, selectedJunctionId]);

    const mapRef = useRef(null);
    const drawingManagerRef = useRef(null);

    // 1. Fetch Junctions
    useEffect(() => {
        const qJ = query(collection(db, "junctions"));
        const unsubJ = onSnapshot(qJ, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                const locObj = (d.latitude && d.longitude ? { latitude: d.latitude, longitude: d.longitude } : null) || d.location || d.centerLocation;
                return { ...d, id: doc.id, parsedLocation: getLatLng(locObj) };
            }).filter(j => j.parsedLocation);
            setJunctions(data);
        });

        // 2. Fetch Signals
        const qS = query(collection(db, "signals"));
        const unsubS = onSnapshot(qS, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                const locObj = (d.latitude && d.longitude ? { latitude: d.latitude, longitude: d.longitude } : null) || d.location || d.centerLocation;
                return { ...d, id: doc.id, parsedLocation: getLatLng(locObj) };
            });
            setSignals(data);
        });

        return () => { unsubJ(); unsubS(); };
    }, []);

    // 3. Combine Data
    useEffect(() => {
        if (junctions.length > 0) {
            const combined = junctions.map(j => {
                const junctionSignals = signals.filter(s =>
                    (j.signalIds && j.signalIds.includes(s.id || s.lightId)) ||
                    (s.junctionId === j.id)
                );
                return { ...j, linkedSignals: junctionSignals };
            });
            setCombinedData(combined);
        }
    }, [junctions, signals]);

    // Filter logic
    const filteredJunctions = combinedData.filter(j =>
        (j.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.id.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const handleMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onOverlayComplete = async (e) => {
        const overlay = e.overlay;
        let type = e.type;

        const currentItem = activeItemRef.current;
        const currentJunction = selectedJunctionRef.current;

        if (!currentItem) {
            overlay.setMap(null);
            alert("Please select an item (Traffic Light or Junction Circle) from the list slightly to the left.");
            return;
        }

        // Hide guide after drawing attempt (save or fail) to clear view
        setShowVisualGuide(false);

        if (type === 'polygon') {
            const path = overlay.getPath();
            const coordinates = [];

            for (let i = 0; i < path.getLength(); i++) {
                const pt = path.getAt(i);
                coordinates.push({ lat: pt.lat(), lng: pt.lng() });
            }

            // Simplified: No validation, just save.
            overlay.setMap(null);

            if (currentItem.type !== 'signal') {
                alert("Polygons are for Traffic Light Approach Roads only.");
                return;
            }

            const currentSignal = currentItem.data;
            const roadName = currentSignal.lightId || currentSignal.id;

            if (currentSignal.geofence) {
                if (!confirm(`Geofence for ${roadName} already exists. Overwrite?`)) return;
            }

            // SAVE TO SIGNALS COLLECTION
            try {
                await updateDoc(doc(db, "signals", currentSignal.id), {
                    geofence: {
                        type: 'polygon',
                        coordinates,
                        label: `Approach for ${roadName}`,
                        // No 'distance' field stored as per simplified requirements
                    }
                });
                setActiveItem(null);
            } catch (err) {
                console.error("Error saving signal geofence:", err);
                alert("Failed to save signal geofence.");
            }

        } else if (type === 'circle') {
            const center = { lat: overlay.getCenter().lat(), lng: overlay.getCenter().lng() };
            const radius = overlay.getRadius();
            overlay.setMap(null);

            if (currentItem.type !== 'junction') {
                alert("Circles are for the Junction Exit/Center only.");
                return;
            }

            setTimeout(async () => {
                if (confirm("Set this as the Junction Exit Circle?")) {
                    // SAVE TO JUNCTIONS COLLECTION
                    if (!currentJunction) return;
                    try {
                        await updateDoc(doc(db, "junctions", currentJunction.id), {
                            junctionCircle: { type: 'circle', center, radius }
                        });
                    } catch (err) {
                        console.error("Error saving junction circle:", err);
                        alert("Failed to save junction circle.");
                    }
                }
            }, 100);
        }

        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }
    };

    const deleteSignalGeofence = async (signalId) => {
        if (!confirm(`Delete approach road geofence?`)) return;
        try {
            await updateDoc(doc(db, "signals", signalId), {
                geofence: deleteField()
            });
        } catch (err) {
            alert("Failed to delete geofence.");
        }
    };

    const deleteCircleGeofence = async (junctionId) => {
        if (!confirm(`Delete junction circle?`)) return;
        try {
            await updateDoc(doc(db, "junctions", junctionId), {
                junctionCircle: deleteField()
            });
        } catch (err) {
            alert("Failed to delete circle.");
        }
    };

    const handleJunctionClick = (item) => {
        if (selectedJunctionId === item.id) {
            setSelectedJunctionId(null);
            setActiveItem(null);
        } else {
            setSelectedJunctionId(item.id);
            setActiveItem(null); // Reset tool selection on fresh open
            if (mapRef.current && item.parsedLocation) {
                mapRef.current.panTo(item.parsedLocation);
                mapRef.current.setZoom(15);
            }
        }
    };

    if (loadError) return <div style={{ padding: '40px', color: 'red' }}>Map Error: {loadError.message}</div>;
    if (!isLoaded) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Geofencing Module...</div>;

    // Determine available modes for DrawingManager
    let drawingModes = [];
    if (isDrawingMode) {
        if (activeItem?.type === 'signal') drawingModes = [window.google.maps.drawing.OverlayType.POLYGON];
        if (activeItem?.type === 'junction') drawingModes = [window.google.maps.drawing.OverlayType.CIRCLE];
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '20px', animation: 'fadeIn 0.5s' }}>
            {/* Sidebar List */}
            <div style={{
                width: '320px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: '#f9fafb' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#111' }}>Junctions</h3>
                    <div style={{ display: 'flex', marginTop: '10px', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 10px' }}>
                        <Search size={16} color="#9ca3af" />
                        <input
                            type="text"
                            placeholder="Search Junctions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                padding: '10px',
                                width: '100%',
                                fontSize: '0.9rem',
                                color: '#374151'
                            }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredJunctions.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                            <Activity size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <div>No Junctions Found</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                                {searchQuery ? 'Try a different search term.' : 'Ensure junctions are added in the system.'}
                            </div>
                        </div>
                    ) : (
                        filteredJunctions.map(j => (
                            <JunctionItem
                                key={j.id}
                                junction={j}
                                signals={j.linkedSignals}
                                isSelected={selectedJunctionId === j.id}
                                onClick={handleJunctionClick}
                                activeItem={activeItem}
                                onSelectItem={setActiveItem}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                {selectedJunctionData && (
                    <div style={{
                        position: 'absolute', top: 20, left: 20, zIndex: 10,
                        background: 'rgba(255,255,255,0.95)', padding: '15px', borderRadius: '12px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backdropFilter: 'blur(5px)',
                        minWidth: '280px', maxWidth: '350px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{selectedJunctionData.name || 'Junction'} Config</h4>
                            <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                        </div>

                        {activeItem ? (
                            <div style={{ marginBottom: '10px', padding: '10px', background: activeItem.type === 'junction' ? '#f97316' : '#3b82f6', color: '#fff', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <strong>Drawing Geofence for:</strong><br />
                                {activeItem.type === 'junction' ? 'Junction Center/Exit' : (activeItem.data.lightId || activeItem.data.id)}
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '4px' }}>
                                    {activeItem.type === 'junction'
                                        ? 'Draw a CIRCLE covering the intersection.'
                                        : 'Click to drop polygon points. Click the first point to close and save.'}
                                </div>
                                <button
                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                    style={{
                                        marginTop: '10px', width: '100%', padding: '6px',
                                        background: isDrawingMode ? 'rgba(255,255,255,0.2)' : '#fff',
                                        color: isDrawingMode ? '#fff' : '#3b82f6',
                                        border: isDrawingMode ? '1px solid rgba(255,255,255,0.5)' : 'none',
                                        borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    {isDrawingMode ? '✋ Switch to Drag Map' : '✏️ Switch to Drawing Mode'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '10px', padding: '10px', background: '#f3f4f6', color: '#6b7280', borderRadius: '8px', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                Select an item from the list to start drawing.
                            </div>
                        )}

                        {/* Geofences List */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '5px', textTransform: 'uppercase' }}>Configured Zones</div>

                            {selectedJunctionData.junctionCircle && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px', background: '#fff7ed', borderRadius: '6px', marginBottom: '5px', border: '1px solid #ffedd5' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2410c' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                                        Junction Exit Circle
                                    </span>
                                    <button onClick={() => deleteCircleGeofence(selectedJunctionData.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', opacity: 0.7, padding: 4 }} title="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}

                            {selectedJunctionData.linkedSignals.map(sig => {
                                if (!sig.geofence) return null;
                                return (
                                    <div key={sig.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px', background: '#ecfdf5', borderRadius: '6px', marginBottom: '5px', border: '1px solid #d1fae5' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857' }}>
                                            <div style={{ width: 8, height: 8, background: '#10b981', transform: 'rotate(45deg)' }} />
                                            {sig.lightId || sig.id.substring(0, 6)}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button onClick={() => deleteSignalGeofence(sig.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', opacity: 0.7, padding: 4 }} title="Remove">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {(!selectedJunctionData.junctionCircle && !selectedJunctionData.linkedSignals.some(s => s.geofence)) && (
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic', padding: '10px', textAlign: 'center', background: '#f9fafb', borderRadius: '6px' }}>
                                    No geofences set yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={12}
                    options={mapOptions}
                    onLoad={handleMapLoad}
                >
                    {/* Junction Markers */}
                    {combinedData.map(j => (
                        <Marker
                            key={j.id}
                            position={j.parsedLocation}
                            onClick={() => handleJunctionClick(j)}
                            icon={selectedJunctionId === j.id ? undefined : {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 6,
                                fillColor: "#F59E0B",
                                fillOpacity: 1,
                                strokeWeight: 1,
                                strokeColor: "#ffffff",
                            }}
                        />
                    ))}

                    {selectedJunctionData && (
                        <>
                            {/* Signal Markers */}
                            {selectedJunctionData.linkedSignals.map(sig => {
                                if (!sig.parsedLocation) return null;
                                const isEditing = activeItem?.type === 'signal' && activeItem?.data?.id === sig.id;
                                return (
                                    <Marker
                                        key={`marker-sig-${sig.id}`}
                                        position={sig.parsedLocation}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: isEditing ? 8 : 5,
                                            fillColor: isEditing ? "#eab308" : "#3b82f6", // Yellow/Gold when editing
                                            fillOpacity: 1,
                                            strokeWeight: 2,
                                            strokeColor: "#ffffff"
                                        }}
                                        zIndex={isEditing ? 100 : 1}
                                        label={isEditing ? {
                                            text: sig.lightId || "Signal",
                                            color: '#1f2937',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            className: 'signal-label-bg'
                                        } : null}
                                    />
                                );
                            })}
                            {/* Visual Guide Circle (1000m) */}
                            {showVisualGuide && selectedJunctionData.parsedLocation && (
                                <Circle
                                    center={selectedJunctionData.parsedLocation}
                                    radius={1000}
                                    options={{
                                        fillColor: "transparent",
                                        strokeColor: "#3b82f6",
                                        strokeOpacity: 0.3,
                                        strokeWeight: 1,
                                        clickable: false,
                                        zIndex: 0
                                    }}
                                />
                            )}

                            {selectedJunctionData.linkedSignals.map(sig => {
                                if (!sig.geofence || sig.geofence.type !== 'polygon') return null;
                                return (
                                    <Polygon
                                        key={`${sig.id}-${sig.geofence.coordinates.length}`}
                                        paths={sig.geofence.coordinates}
                                        onUnmount={p => p.setMap(null)}
                                        options={{
                                            fillColor: "#10b981",
                                            fillOpacity: 0.35,
                                            strokeColor: "#059669",
                                            strokeWeight: 2,
                                        }}
                                    />
                                );
                            })}

                            {selectedJunctionData.junctionCircle && (
                                <Circle
                                    key={`circle-${selectedJunctionData.junctionCircle.radius}`}
                                    center={selectedJunctionData.junctionCircle.center}
                                    radius={selectedJunctionData.junctionCircle.radius}
                                    onUnmount={c => c.setMap(null)}
                                    options={{
                                        fillColor: "#f97316",
                                        fillOpacity: 0.35,
                                        strokeColor: "#c2410c",
                                        strokeWeight: 2,
                                    }}
                                />
                            )}

                            {/* Dynamically Render DrawingManager based on Active Item */}
                            {activeItem && (
                                <DrawingManager
                                    onLoad={manager => drawingManagerRef.current = manager}
                                    onOverlayComplete={onOverlayComplete}
                                    options={{
                                        drawingControl: true,
                                        drawingControlOptions: {
                                            position: window.google.maps.ControlPosition.BOTTOM_CENTER,
                                            drawingModes: drawingModes
                                        },
                                        polygonOptions: {
                                            fillColor: "#10b981",
                                            fillOpacity: 0.5,
                                            strokeWeight: 2,
                                            clickable: false,
                                            editable: true,
                                            zIndex: 1
                                        },
                                        circleOptions: {
                                            fillColor: "#f97316",
                                            fillOpacity: 0.5,
                                            strokeWeight: 2,
                                            clickable: false,
                                            editable: true,
                                            zIndex: 1
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}
                </GoogleMap>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .signal-label-bg {
                    background: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    margin-top: -25px; /* Offset it above the marker */
                }
            `}</style>
        </div>
    );
};

export default GeofencingManagement;
