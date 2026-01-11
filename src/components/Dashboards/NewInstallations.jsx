import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-compass';
import 'leaflet-compass/dist/leaflet-compass.min.css';
import L from 'leaflet';

// Fix for Leaflet icons
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
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 10px', borderRadius: '12px',
            background: bg, color: color, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
        }}>
            {label}
        </span>
    );
};

// --- SUB-COMPONENTS for Wizard ---

// Step 1: Scanner
const StepScanner = ({ onScan }) => {
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const isRunningRef = useRef(false);

    useEffect(() => {
        // Cleanup previous instance if exists (safety)
        if (scannerRef.current) {
            try {
                if (isRunningRef.current) {
                    scannerRef.current.stop().catch(() => { });
                }
                scannerRef.current.clear();
            } catch (e) { }
        }

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        // Small delay to ensure DOM is painted
        const timer = setTimeout(() => {
            scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // Success callback
                    if (isRunningRef.current) {
                        isRunningRef.current = false;
                        scanner.stop()
                            .then(() => {
                                scanner.clear();
                                onScan(decodedText);
                            })
                            .catch(err => {
                                console.warn("Stop failed on success", err);
                                scanner.clear();
                                onScan(decodedText);
                            });
                    }
                },
                (err) => {
                    // Ignore frame parse errors
                }
            ).then(() => {
                isRunningRef.current = true;
            }).catch(err => {
                console.error("Scanner start error", err);
                // Only show error if we are still mounted
                setError("Camera access denied or unavailable.");
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scanner && isRunningRef.current) {
                isRunningRef.current = false;
                scanner.stop().then(() => scanner.clear()).catch(err => console.warn("Unmount stop error", err));
            } else if (scanner) {
                try { scanner.clear(); } catch (e) { }
            }
        };
    }, [onScan]);

    return (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '20px' }}>Scan Signal QR</h3>
            {error ? (
                <div style={{ color: 'red', padding: '20px', background: '#ffe6e6', borderRadius: '8px' }}>
                    {error} <br /> <button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>Retry</button>
                </div>
            ) : (
                <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', flex: 1, borderRadius: '12px', overflow: 'hidden', background: '#000' }}></div>
            )}
            <p style={{ marginTop: '20px', color: '#666' }}>Point camera at the QR code on the traffic light chassis.</p>
        </div>
    );
};

// Step 2: Location
const StepLocation = ({ onLocationFound }) => {
    const [status, setStatus] = useState('Acquiring GPS Signal...');

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatus("Geolocation not supported on this device.");
            return;
        }

        const success = (pos) => {
            setStatus("Location Locked!");
            setTimeout(() => {
                onLocationFound(pos.coords);
            }, 1000); // 1s delay to show success
        };

        const error = (err) => {
            setStatus("Failed to get location: " + err.message);
        };

        navigator.geolocation.getCurrentPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }, [onLocationFound]);

    return (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid #f3f3f3', borderTop: '4px solid #6c5ce7', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
            <h3>{status}</h3>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// Step 3: Compass (Leaflet Version)
const CompassHandler = ({ onHeadingChange }) => {
    const map = useMap();

    useEffect(() => {
        // Initialize leaflet-compass
        // Check if the control exists on L.Control (it should if imported correctly)
        if (!L.Control.Compass) {
            console.error("Leaflet Compass not loaded");
            return;
        }

        const compass = new L.Control.Compass({
            autoActive: true,
            showDigit: true,
            position: 'topright',
            textErr: 'Compass not supported'
        });

        // Add to map
        map.addControl(compass);

        // Listen for events
        const handleRotate = (e) => {
            // e.angle is the heading (0-360)
            if (e.angle !== undefined) {
                onHeadingChange(Math.round(e.angle));
            }
        };

        map.on('compass:rotated', handleRotate);

        return () => {
            map.off('compass:rotated', handleRotate);
            map.removeControl(compass);
        };
    }, [map, onHeadingChange]);

    return null;
};

const StepCompass = ({ onConfirm, location }) => {
    const [heading, setHeading] = useState(0);

    // Default to London if no location (should not happen in flow)
    const center = location ? [location.latitude, location.longitude] : [51.505, -0.09];

    return (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '10px' }}>Align Direction</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '0.9rem' }}>
                Face the traffic light. The map connects to your device compass.
            </p>

            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', border: '1px solid #ddd', position: 'relative' }}>
                <MapContainer center={center} zoom={19} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OSM'
                    />
                    {location && <Marker position={center} />}
                    <CompassHandler onHeadingChange={setHeading} />
                </MapContainer>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 10px' }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase' }}>Heading</div>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3436' }}>{heading}°</div>
                </div>
            </div>

            <button
                onClick={() => onConfirm(heading)}
                style={{ width: '100%', padding: '16px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '600', boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)' }}
            >
                Confirm Direction
            </button>
        </div>
    );
};

// Step 4: Review
const StepReview = ({ data, onComplete }) => {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3>Review Installation</h3>
            <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', margin: '20px 0', flex: 1 }}>
                <div style={{ marginBottom: '15px' }}>
                    <small style={{ color: '#999', textTransform: 'uppercase' }}>Serial Number</small>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2d3436' }}>{data.serialNumber}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <small style={{ color: '#999', textTransform: 'uppercase' }}>Direction</small>
                    <div style={{ fontSize: '1.2rem' }}>{data.direction}°</div>
                </div>
                <div>
                    <small style={{ color: '#999', textTransform: 'uppercase' }}>Location</small>
                    <div style={{ fontSize: '1.1rem' }}>{data.location?.latitude.toFixed(6)}, {data.location?.longitude.toFixed(6)}</div>
                </div>
            </div>
            <button
                onClick={onComplete}
                style={{ width: '100%', padding: '16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)' }}
            >
                Complete Installation
            </button>
        </div>
    );
};

// Step 5: Success
const StepSuccess = ({ onFinish }) => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="40" height="40" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 style={{ marginBottom: '10px' }}>Installation Complete!</h2>
        <p style={{ color: '#666', marginBottom: '40px' }}>The signal has been registered successfully.</p>
        <button
            onClick={onFinish}
            style={{ width: '100%', padding: '16px', background: '#f0f0f0', color: '#2d3436', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600' }}
        >
            Done
        </button>
    </div>
);

const SignalCard = ({ data }) => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2d3436' }}>{data.lightId || 'Unknown ID'}</span>
            <StatusBadge status={data.status} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#636e72' }}>
            <span>{data.location ? `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}` : 'No Location'}</span>
            <span>{formatDate(data.installedAt)}</span>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const NewInstallations = () => {
    const [view, setView] = useState('list'); // 'list' | 'wizard'
    const [step, setStep] = useState(1);
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installData, setInstallData] = useState({}); // { serialNumber, location, direction }

    // Fetch Data
    useEffect(() => {
        const q = query(collection(db, "signals"), orderBy("installedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSignals(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const startInstallation = useCallback(() => {
        setInstallData({});
        setStep(1);
        setView('wizard');
    }, []);

    const handleStep1Scan = useCallback((code) => {
        setInstallData(prev => ({ ...prev, serialNumber: code }));
        setStep(2);
    }, []);

    const handleStep2Location = useCallback((coords) => {
        setInstallData(prev => ({ ...prev, location: { latitude: coords.latitude, longitude: coords.longitude } }));
        setStep(3);
    }, []);

    const handleStep3Compass = useCallback((heading) => {
        setInstallData(prev => ({ ...prev, direction: heading }));
        setStep(4);
    }, []);

    const handleStep4Complete = useCallback(async () => {
        try {
            await addDoc(collection(db, "signals"), {
                lightId: installData.serialNumber,
                location: new GeoPoint(installData.location.latitude, installData.location.longitude),
                direction: installData.direction,
                status: 'working',
                geoFenceRadius: 500,
                installedAt: serverTimestamp(),
                registeredBy: auth.currentUser?.email || 'Unknown'
            });
            setStep(5);
        } catch (error) {
            console.error(error);
            alert("Save failed: " + error.message);
        }
    }, [installData]);

    const handleFinish = useCallback(() => {
        setView('list');
    }, []);

    const cancelWizard = useCallback(() => {
        if (window.confirm("Cancel installation?")) {
            setView('list');
        }
    }, []);

    // --- VIEW: LIST ---
    const ListView = () => (
        <div className="mobile-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#2d3436' }}>Manage Signals</h2>
                <div style={{ width: '32px', height: '32px', background: '#dfe6e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>🛠️</span>
                </div>
            </div>
            <button
                onClick={startInstallation}
                style={{ width: '100%', background: '#6c5ce7', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px', boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)', cursor: 'pointer' }}
            >
                <span style={{ fontSize: '1.2rem' }}>+</span> Register New Signal
            </button>
            <div>
                {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>Loading...</div> :
                    signals.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#b2bec3' }}>No signals yet.</div> :
                        signals.map(s => <SignalCard key={s.id} data={s} />)
                }
            </div>
        </div>
    );

    // --- VIEW: WIZARD ---
    const WizardView = () => (
        <div className="mobile-container" style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
            {/* Wizard Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
                {step < 5 && (
                    <button onClick={cancelWizard} style={{ position: 'absolute', left: 0, padding: '10px 0', border: 'none', background: 'transparent', color: '#999', fontWeight: '500' }}>
                        Cancel
                    </button>
                )}
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#2d3436' }}>
                    {step === 5 ? 'Done' : `Step ${step} of 4`}
                </div>
            </div>

            {/* Steps */}
            {step === 1 && <StepScanner onScan={handleStep1Scan} />}
            {step === 2 && <StepLocation onLocationFound={handleStep2Location} />}
            {step === 3 && <StepCompass onConfirm={handleStep3Compass} location={installData.location} />}
            {step === 4 && <StepReview data={installData} onComplete={handleStep4Complete} />}
            {step === 5 && <StepSuccess onFinish={handleFinish} />}
        </div>
    );

    return (
        <div style={{ paddingBottom: '80px' }}>
            {view === 'list' ? <ListView /> : <WizardView />}
            <style>{`.mobile-container { max-width: 600px; margin: 0 auto; height: 100%; }`}</style>
        </div>
    );
};

export default NewInstallations;
