import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, GeoPoint } from 'firebase/firestore';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- UTILS ---
const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

const StatusBadge = ({ status }) => {
    const s = (status || 'working').toLowerCase();
    let color = '#2ecc71';
    let bg = '#d5f5e3';
    let label = status || 'Working';

    if (s === 'faulty') { color = '#e74c3c'; bg = '#fadbd8'; label = 'Faulty'; }
    if (s === 'repairing') { color = '#f39c12'; bg = '#fdebd0'; label = 'Repairing'; }

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: bg, color: color, fontSize: '0.85rem', fontWeight: '500', textTransform: 'capitalize'
        }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></span>
            {label}
        </span>
    );
};

// --- SUB-COMPONENTS ---

const CompassUI = ({ heading, onLock }) => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            {/* Minimalist Compass */}
            <div style={{
                width: '220px', height: '220px', borderRadius: '50%', border: '8px solid #f0f0f0', margin: '0 auto 25px',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
            }}>
                {/* Dial marks */}
                {['N', 'E', 'S', 'W'].map((dir, i) => (
                    <div key={dir} style={{
                        position: 'absolute', fontWeight: 'bold', color: i === 0 ? '#e74c3c' : '#bdc3c7',
                        top: i === 0 ? '10px' : i === 2 ? 'auto' : '50%',
                        bottom: i === 2 ? '10px' : 'auto',
                        left: i === 3 ? '15px' : i === 1 ? 'auto' : '50%',
                        right: i === 1 ? '15px' : 'auto',
                        transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)'
                    }}>{dir}</div>
                ))}

                {/* Rotating Indicator */}
                <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    transform: `rotate(${-heading}deg)`, transition: 'transform 0.1s linear'
                }}>
                    <div style={{
                        position: 'absolute', top: '25px', left: '50%', transform: 'translateX(-50%)',
                        width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #2d3436'
                    }}></div>
                </div>

                {/* Center Value */}
                <div style={{ zIndex: 2, fontSize: '2.5rem', fontWeight: '800', color: '#2d3436' }}>
                    {heading}°
                </div>
            </div>

            <p style={{ color: '#636e72', marginBottom: '20px' }}>Align your phone with the traffic light signal direction.</p>

            <button onClick={onLock} className="primary-btn">
                Lock Direction
            </button>
        </div>
    );
};

const InlineWizard = ({ onCancel, onComplete }) => {
    // Steps: 1=Scan(includes Location), 2=Compass, 3=Confirm
    const [step, setStep] = useState(1);
    const [scannedId, setScannedId] = useState(null);
    const [location, setLocation] = useState(null);
    const [direction, setDirection] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scannerActive, setScannerActive] = useState(false); // Controls UI view
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Logic to start/stop scanner based on state
    useEffect(() => {
        let scanner = null;

        const initScanner = async () => {
            // Wait a tick to ensure DOM is ready just in case
            await new Promise(r => setTimeout(r, 100));

            const readerElement = document.getElementById("reader");
            if (!readerElement) {
                console.error("Reader element not found");
                setErrorMessage("Scanner initialization failed. Please try again.");
                setScannerActive(false);
                return;
            }

            try {
                scanner = new Html5Qrcode("reader");

                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        handleScanSuccess(decodedText, scanner);
                    },
                    (errorMessage) => {
                        // ignore
                    }
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                setScannerActive(false);

                let msg = "Failed to access camera.";
                if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
                    msg = "Camera permission denied. Please allow camera access in your browser settings and try again.";
                } else if (err?.name === 'NotFoundError') {
                    msg = "No camera found on this device.";
                } else if (err?.name === 'NotReadableError') {
                    msg = "Camera is already in use by another application.";
                } else if (typeof err === 'string') {
                    msg = err;
                }

                setErrorMessage(msg);
            }
        };

        if (scannerActive) {
            initScanner();
        }

        // Cleanup on unmount or deps change
        return () => {
            if (scanner) {
                scanner.stop().then(() => scanner.clear()).catch(err => console.log("Stop error", err));
            }
        };
    }, [scannerActive]);

    const startScanner = () => {
        setErrorMessage(null);
        setScannerActive(true);
    };

    const stopScanner = () => {
        setScannerActive(false);
    };

    const handleScanSuccess = (decodedText, scannerInstance) => {
        setScannedId(decodedText);
        setScannerActive(false); // Will trigger cleanup
        captureLocation();
    };

    const captureLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setIsLocating(false);
                setStep(2); // Move to Compass immediately
            },
            (err) => {
                console.error("Location error:", err);
                setIsLocating(false);
                let msg = "Unable to retrieve location.";
                if (err.code === 1) msg = "Location permission denied. Please allow location access.";
                setErrorMessage(msg + " Try refreshing.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Compass Logic
    const [tempDirection, setTempDirection] = useState(0);
    useEffect(() => {
        if (step === 2) {
            const handleOrientation = (e) => {
                let heading = e.alpha;
                if (e.webkitCompassHeading) heading = e.webkitCompassHeading;
                if (heading !== null) setTempDirection(Math.round(heading));
            };
            window.addEventListener('deviceorientation', handleOrientation, true);
            return () => window.removeEventListener('deviceorientation', handleOrientation, true);
        }
    }, [step]);

    const handleRegister = async () => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "streetlights"), {
                lightId: scannedId,
                location: new GeoPoint(location.lat, location.lng),
                direction: direction,
                geoFenceRadius: 500,
                status: 'working',
                installedAt: serverTimestamp(),
                registeredBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Unknown Installer'
            });
            onComplete();
        } catch (error) {
            console.error(error);
            setFeedback('error');
            setIsSubmitting(false);
        }
    };

    // Map View for Confirmation
    const MapView = ({ center, radius }) => {
        const SetViewOnClick = ({ coords }) => {
            const map = useMap();
            map.setView(coords, map.getZoom());
            return null;
        };
        return (
            <MapContainer center={center} zoom={16} style={{ height: '200px', width: '100%', borderRadius: '12px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={center} />
                {radius && <Circle center={center} radius={radius} pathOptions={{ color: '#e74c3c' }} />}
                <SetViewOnClick coords={center} />
            </MapContainer>
        );
    };

    return (
        <div style={{ animation: 'slideDown 0.3s ease-out', marginBottom: '30px' }}>
            <div style={{ background: '#fff', border: '1px dashed #ccc', borderRadius: '12px', padding: '30px', textAlign: 'center', position: 'relative' }}>

                {errorMessage && <div style={{ color: '#721c24', background: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{errorMessage}</div>}

                {/* Step 1: Scan & Location */}
                {step === 1 && (
                    <div>
                        {!scannerActive && !scannedId && !isLocating ? (
                            <div style={{ padding: '40px 20px' }}>
                                <p style={{ color: '#666', marginBottom: '20px' }}>Point the camera at a valid QR Code.</p>
                                <div style={{
                                    border: '1px solid #eee', borderRadius: '8px', padding: '30px', maxWidth: '400px', margin: '0 auto', background: '#f9f9f9',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2d3436" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    <div>
                                        <button onClick={startScanner} style={{ background: '#fff', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', marginRight: '10px' }}>
                                            Request Camera Permissions
                                        </button>
                                        <button disabled style={{ background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'not-allowed', color: '#999' }}>
                                            Scan an Image File
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : isLocating ? (
                            <div style={{ padding: '40px', color: '#6c5ce7' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px', width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid #6c5ce7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <h3 style={{ margin: 0 }}>Acquiring GPS Location...</h3>
                                <p>Please stand still under the light.</p>
                                {/* Fallback button for manual trigger if auto-prompt is blocked */}
                                <button onClick={captureLocation} style={{ marginTop: '20px', background: 'transparent', border: '1px solid #6c5ce7', color: '#6c5ce7', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                    Tap to Retry / Allow Permission
                                </button>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : scannerActive ? (
                            <div>
                                {/* Provide a consistent container for the reader */}
                                <div id="reader" style={{ maxWidth: '500px', margin: '0 auto', minHeight: '300px', background: '#000' }}></div>
                                <button onClick={stopScanner} style={{ marginTop: '10px', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel Scan</button>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Step 2: Compass */}
                {step === 2 && (
                    <CompassUI
                        heading={tempDirection}
                        onLock={() => { setDirection(tempDirection); setStep(3); }}
                    />
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="step-container">
                        <h3>Confirm Registration</h3>
                        <div style={{ margin: '20px auto', maxWidth: '600px', textAlign: 'left' }}>
                            <MapView center={[location.lat, location.lng]} radius={500} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div className="info-box"><strong>ID:</strong> {scannedId}</div>
                                <div className="info-box"><strong>Direction:</strong> {direction}°</div>
                                <div className="info-box" style={{ gridColumn: 'span 2' }}>
                                    <strong>GPS:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleRegister} disabled={isSubmitting} className="primary-btn">
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>
                )}

            </div>
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .primary-btn { background: #6c5ce7; color: white; border: none; padding: 10px 24px; borderRadius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; }
                .primary-btn:hover { background: #5b4cc4; }
                .step-container { padding: 20px; }
                .info-box { background: #f8f9fa; padding: 10px; border-radius: 6px; }
            `}</style>
        </div>
    );
};

// --- MAIN COMPONENT ---

const NewInstallations = () => {
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [lights, setLights] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const q = query(collection(db, "streetlights"), orderBy("installedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    lat: d.location?.latitude,
                    lng: d.location?.longitude
                };
            });
            setLights(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '5px', color: '#2d3436' }}>Manage Streetlights</h1>
                    <p style={{ color: '#636e72' }}>Scan, search, and manage all lights in the network.</p>
                </div>

                {/* Toggle Button */}
                {!isScannerOpen ? (
                    <button
                        onClick={() => setScannerOpen(true)}
                        style={{
                            background: '#6c5ce7', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '8px',
                            fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px rgba(108, 92, 231, 0.2)'
                        }}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Open Scanner
                    </button>
                ) : (
                    <button
                        onClick={() => setScannerOpen(false)}
                        style={{
                            background: '#6c5ce7', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '8px',
                            fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Close Scanner
                    </button>
                )}
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
                {isScannerOpen ? 'Register New Light' : 'Registered Lights (' + lights.length + ')'}
            </h2>

            {/* Inline Wizard */}
            {isScannerOpen && (
                <InlineWizard
                    onCancel={() => setScannerOpen(false)}
                    onComplete={() => {
                        setScannerOpen(false);
                        // optional toast success
                    }}
                />
            )}

            {/* List Card */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e0e0e0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                {/* Toolbar */}
                <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#2d3436' }}>Registered Lights ({lights.length})</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text" placeholder="Search by ID..."
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dfe6e9', background: '#f8f9fa' }}
                        />
                        {['All', 'Working', 'Faulty', 'Repairing'].map(status => (
                            <button key={status} style={{
                                padding: '6px 16px', borderRadius: '6px', border: '1px solid #dfe6e9',
                                background: status === 'All' ? '#6c5ce7' : 'white',
                                color: status === 'All' ? 'white' : '#636e72',
                                cursor: 'pointer', fontSize: '0.9rem'
                            }}>
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', color: '#b2bec3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '15px 20px', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left' }}>Location</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '15px 20px', textAlign: 'left' }}>Installed On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : lights.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>No streetlights registered yet.</td></tr>
                            ) : (
                                lights.map((light, index) => (
                                    <tr key={light.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#6c5ce7' }}>{light.lightId || '—'}</td>
                                        <td style={{ padding: '15px 20px', color: '#636e72' }}>
                                            {light.lat ? `${light.lat.toFixed(4)}, ${light.lng.toFixed(4)}` : '—'}
                                        </td>
                                        <td style={{ padding: '15px 20px' }}><StatusBadge status={light.status} /></td>
                                        <td style={{ padding: '15px 20px', color: '#636e72' }}>{formatDate(light.installedAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default NewInstallations;
