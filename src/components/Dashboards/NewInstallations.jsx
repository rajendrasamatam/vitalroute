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

const CompassUI = ({ heading, onLock, location }) => {
    // Generate tick marks
    const ticks = [];
    for (let i = 0; i < 360; i += 2) {
        const isMajor = i % 30 === 0;
        const isMedium = i % 10 === 0;
        ticks.push(
            <div key={i} style={{
                position: 'absolute',
                left: '50%', top: '50%',
                width: isMajor ? '4px' : isMedium ? '2px' : '1px',
                height: isMajor ? '20px' : isMedium ? '15px' : '8px',
                backgroundColor: isMajor ? '#fff' : 'rgba(255,255,255,0.4)',
                transform: `translate(-50%, -50%) rotate(${i}deg) translateY(-120px)`,
                transformOrigin: 'center center'
            }} />
        );
        // Add numbers for major ticks
        if (isMajor) {
            ticks.push(
                <div key={`num-${i}`} style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transform: `translate(-50%, -50%) rotate(${i}deg) translateY(-95px) rotate(-${i}deg)`,
                    transformOrigin: 'center center'
                }}>
                    {i}
                </div>
            );
        }
    }

    const getCardinal = (deg) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(deg / 45) % 8];
    };

    return (
        <div style={{
            background: '#000', borderRadius: '20px', padding: '30px 20px',
            color: '#fff', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            maxWidth: '400px', margin: '0 auto'
        }}>
            {/* Top Heading */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ff7675' }}>
                    {heading}° <span style={{ fontSize: '1.5rem', color: '#fff' }}>{getCardinal(heading)}</span>
                </div>
            </div>

            {/* Compass Dial */}
            <div style={{
                width: '300px', height: '300px', margin: '0 auto 30px',
                position: 'relative', borderRadius: '50%',
                background: 'radial-gradient(circle, #2d3436 0%, #000 70%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,1), 0 0 10px rgba(255,255,255,0.1)'
            }}>
                {/* Rotating Container */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    transform: `rotate(${-heading}deg)`,
                    transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' // CSS Smoothing
                }}>
                    {ticks}

                    {/* Cardinal Letters (Fixed to the dial, so they rotate with it) */}
                    {['N', 'E', 'S', 'W'].map((dir, i) => (
                        <div key={dir} style={{
                            position: 'absolute',
                            left: '50%', top: '50%',
                            fontSize: '24px', fontWeight: '900',
                            color: dir === 'N' ? '#ff7675' : '#fff',
                            transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-60px) rotate(-${i * 90}deg)`,
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            {dir}
                        </div>
                    ))}
                </div>

                {/* Fixed Center Crosshair/Indicator */}
                <div style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: '10px', height: '10px', background: '#fff', borderRadius: '50%',
                    boxShadow: '0 0 10px #fff'
                }} />
                <div style={{
                    position: 'absolute', left: '50%', top: '20px', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                    borderBottom: '20px solid #ff7675', zIndex: 10
                }} />

            </div>

            {/* Coordinates */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '0 20px',
                borderTop: '1px solid #636e72', paddingTop: '20px',
                fontSize: '0.9rem', color: '#b2bec3', fontFamily: 'monospace'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>LAT</div>
                    <div>{location?.lat?.toFixed(6) || '—'}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>LNG</div>
                    <div>{location?.lng?.toFixed(6) || '—'}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>ELEV</div>
                    <div>{location?.alt ? location.alt.toFixed(1) + 'm' : '—'}</div>
                </div>
            </div>

            <div style={{ marginTop: '30px' }}>
                <button onClick={onLock} style={{
                    background: '#ff7675', color: '#fff', border: 'none',
                    padding: '15px 40px', borderRadius: '30px',
                    fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 5px 15px rgba(255, 118, 117, 0.4)'
                }}>
                    LOCK DIRECTION
                </button>
            </div>
        </div>
    );
};

const InlineWizard = ({ onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [scannedId, setScannedId] = useState(null);
    const [location, setLocation] = useState(null);
    const [direction, setDirection] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // --- SCANNER LOGIC ---
    useEffect(() => {
        let scanner = null;
        const initScanner = async () => {
            await new Promise(r => setTimeout(r, 100)); // DOM wait
            if (!document.getElementById("reader")) return;
            try {
                scanner = new Html5Qrcode("reader");
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => handleScanSuccess(decodedText, scanner),
                    () => { }
                );
            } catch (err) {
                console.error("Scanner Error", err);
                setScannerActive(false);
                let msg = err?.name === 'NotAllowedError' ? "Camera permission denied." : "Failed to access camera.";
                setErrorMessage(msg);
            }
        };
        if (scannerActive) initScanner();
        return () => { if (scanner) scanner.stop().catch(console.error); };
    }, [scannerActive]);

    const handleScanSuccess = (text) => {
        setScannedId(text);
        setScannerActive(false);
        captureLocation();
    };

    const captureLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert("Geolocation not supported"); setIsLocating(false); return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, alt: pos.coords.altitude });
                setIsLocating(false);
                setStep(2);
            },
            (err) => {
                console.error("Location error", err);
                setIsLocating(false);
                setErrorMessage("Location access required. Please allow and retry.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // --- COMPASS LOGIC (With Smoothing) ---
    const [tempDirection, setTempDirection] = useState(0);
    const [compassPermission, setCompassPermission] = useState('unknown');
    // Using ref for smoothing to avoid re-render loops with state dependency
    const headingRef = useRef(0);

    useEffect(() => {
        if (step === 2) {
            headingRef.current = 0; // Reset

            // iOS Permission Check
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                setCompassPermission('required');
            } else {
                setCompassPermission('granted');
                startCompassListener();
            }
        }
        return () => { window.removeEventListener('deviceorientation', handleOrientationWrapper); };
    }, [step]);

    const requestCompassPermission = async () => {
        if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
            try {
                const p = await DeviceOrientationEvent.requestPermission();
                if (p === 'granted') {
                    setCompassPermission('granted');
                    startCompassListener();
                } else alert('Permission denied');
            } catch (e) { alert(e.message); }
        }
    };

    // Wrapper to reference in removeEventListener
    let handleOrientationWrapper;

    const startCompassListener = () => {
        handleOrientationWrapper = (e) => {
            let heading = 0;
            if (e.webkitCompassHeading) heading = e.webkitCompassHeading;
            else if (e.alpha) heading = 360 - e.alpha;

            if (heading < 0) heading += 360;

            // Low Pass Filter Smoothing
            // current = prev + alpha * (target - prev)
            // Handle wrap-around (359 -> 1 should be +2, not -358)
            let current = headingRef.current;
            let diff = heading - current;

            // Normalize diff to -180...180
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            const alpha = 0.15; // Smoothing factor (lower = smoother/slower)
            let smoothHeading = current + (diff * alpha);

            // Normalize result 0...360
            if (smoothHeading < 0) smoothHeading += 360;
            smoothHeading = smoothHeading % 360;

            headingRef.current = smoothHeading;
            setTempDirection(Math.round(smoothHeading));
        };
        window.addEventListener('deviceorientation', handleOrientationWrapper, true);
    };

    const handleRegister = async () => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "signals"), {
                lightId: scannedId,
                location: new GeoPoint(location.lat, location.lng),
                direction: direction,
                geoFenceRadius: 500,
                status: 'working',
                installedAt: serverTimestamp(),
                registeredBy: auth.currentUser?.email || 'Unknown'
            });
            onComplete();
        } catch (e) { console.error(e); setIsSubmitting(false); }
    };

    // MapView
    const MapView = ({ center }) => {
        const SetView = ({ c }) => { useMap().setView(c, 16); return null; };
        return (
            <MapContainer center={center} zoom={16} style={{ height: '200px', width: '100%', borderRadius: '12px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={center} />
                <SetView c={center} />
            </MapContainer>
        );
    };

    return (
        <div style={{ animation: 'slideDown 0.3s ease-out', marginBottom: '30px', width: '100%' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #eee' }}>
                {errorMessage && <div style={{ color: 'red', padding: '10px', background: '#ffe6e6', borderRadius: '6px', marginBottom: '10px' }}>{errorMessage}</div>}

                {step === 1 && (
                    <div style={{ textAlign: 'center' }}>
                        {!scannerActive && !isLocating && !scannedId && (
                            <div style={{ padding: '20px' }}>
                                <p style={{ marginBottom: '15px' }}>Scan the Light ID QR Code</p>
                                <button onClick={() => setScannerActive(true)} style={{ background: '#6c5ce7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '1rem' }}>
                                    Start Scanner
                                </button>
                            </div>
                        )}
                        {isLocating && (
                            <div style={{ padding: '40px' }}>
                                <div className="spinner" style={{ width: 30, height: 30, border: '3px solid #eee', borderTopColor: '#6c5ce7', borderRadius: '50%', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }}></div>
                                <p>Acquiring GPS Location...</p>
                                <button onClick={captureLocation} style={{ marginTop: '15px', background: 'none', border: '1px solid #6c5ce7', color: '#6c5ce7', padding: '5px 10px', borderRadius: '4px' }}>Retry</button>
                            </div>
                        )}
                        {scannerActive && (
                            <div>
                                <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', minHeight: '300px', background: '#000' }}></div>
                                <button onClick={() => setScannerActive(false)} style={{ marginTop: '10px', color: '#e74c3c', background: 'none', border: 'none', textDecoration: 'underline' }}>Cancel</button>
                            </div>
                        )}
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ textAlign: 'center' }}>
                        {compassPermission === 'required' ? (
                            <div style={{ padding: '40px' }}>
                                <p>Compass access required.</p>
                                <button onClick={requestCompassPermission} style={{ background: '#0984e3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px' }}>Allow Access</button>
                            </div>
                        ) : (
                            <CompassUI heading={tempDirection} onLock={() => { setDirection(tempDirection); setStep(3); }} location={location} />
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <h3>Confirm</h3>
                        <div style={{ margin: '15px 0' }}>
                            <MapView center={[location.lat, location.lng]} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', textAlign: 'left', fontSize: '0.9rem' }}>
                                <div style={{ background: '#f5f6fa', padding: '10px', borderRadius: '6px' }}><strong>ID:</strong> {scannedId}</div>
                                <div style={{ background: '#f5f6fa', padding: '10px', borderRadius: '6px' }}><strong>Dir:</strong> {direction}°</div>
                                <div style={{ background: '#f5f6fa', padding: '10px', borderRadius: '6px', gridColumn: 'span 2' }}>
                                    <strong>Loc:</strong> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleRegister} disabled={isSubmitting} style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1rem', width: '100%', cursor: isSubmitting ? 'wait' : 'pointer' }}>
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const NewInstallations = () => {
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [lights, setLights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "signals"), orderBy("installedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), lat: doc.data().location?.latitude, lng: doc.data().location?.longitude })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.5s', paddingBottom: '50px' }}>
            {/* Header - Mobile Responsive Wrapper */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#2d3436' }}>Streetlights</h1>
                    <p style={{ margin: '5px 0 0', color: '#636e72', fontSize: '0.9rem' }}>Manager Dashboard</p>
                </div>
                <button
                    onClick={() => setScannerOpen(!isScannerOpen)}
                    style={{
                        background: isScannerOpen ? '#636e72' : '#6c5ce7', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem',
                        flexGrow: 0
                    }}
                >
                    {isScannerOpen ? 'Close Scanner' : 'New Installation'}
                </button>
            </div>

            {isScannerOpen && <InlineWizard onCancel={() => setScannerOpen(false)} onComplete={() => setScannerOpen(false)} />}

            {/* List - Mobile Responsive Scroll */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #dfe6e9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontWeight: '600' }}>All Lights ({lights.length})</span>
                    <input type="text" placeholder="Search..." style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd' }} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9', textAlign: 'left', color: '#636e72' }}>
                                <th style={{ padding: '12px 15px' }}>ID</th>
                                <th style={{ padding: '12px 15px' }}>Location</th>
                                <th style={{ padding: '12px 15px' }}>Status</th>
                                <th style={{ padding: '12px 15px' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr> :
                                lights.length === 0 ? <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No records found.</td></tr> :
                                    lights.map(l => (
                                        <tr key={l.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                            <td style={{ padding: '12px 15px', fontWeight: '500', color: '#6c5ce7' }}>{l.lightId}</td>
                                            <td style={{ padding: '12px 15px' }}>{l.lat?.toFixed(5)}, {l.lng?.toFixed(5)}</td>
                                            <td style={{ padding: '12px 15px' }}><StatusBadge status={l.status} /></td>
                                            <td style={{ padding: '12px 15px', color: '#b2bec3' }}>{formatDate(l.installedAt)}</td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default NewInstallations;
