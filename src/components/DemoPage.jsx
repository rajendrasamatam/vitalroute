
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Settings, User, Cpu, Cloud, Globe, Minus, Plus } from 'lucide-react';
import { database } from '../firebase';
import { ref as dbRef, set } from 'firebase/database';

// -------- CONFIGURATION --------
const TIMINGS = {
    tl1: { green: 30000, yellow: 2000 },
    tl2: { green: 10000, yellow: 2000 },
    tl3: { green: 10000, yellow: 2000 }
};

const DemoPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const simulationConfig = location.state || { type: 'normal', road: 'r1' };
    const hasSpawnedAmbulance = useRef(false);
    const [ambulanceDetected, setAmbulanceDetected] = useState(false);

    // Visual State
    const [lights, setLights] = useState({
        tl1: 'green',
        tl2: 'red',
        tl3: 'red'
    });

    // Timer State
    const [timers, setTimers] = useState({
        tl1: 0,
        tl2: 0,
        tl3: 0
    });

    const [mode, setMode] = useState('ATC'); // 'ATC' or 'MNL'
    const [emergencyMode, setEmergencyMode] = useState(null);

    // SERIAL PORT STATE
    const [serialPort, setSerialPort] = useState(null);
    const [isSerialConnected, setIsSerialConnected] = useState(false);
    const [isCloudSync, setIsCloudSync] = useState(true);

    // UI STATE
    const [isPanelMinimized, setIsPanelMinimized] = useState(false);

    // VEHICLE SIMULATION STATE
    const [vehicles, setVehicles] = useState([]);
    const vehicleIdCounter = useRef(0);

    // Logic Ref
    const stateRef = useRef({
        tl1: { state: 'green', lastChange: Date.now() },
        tl2: { state: 'red', lastChange: Date.now() },
        tl3: { state: 'red', lastChange: Date.now() },
        nextTurn: 'tl2',
        emergency: false,
        emergencyRoad: null,
        mode: 'ATC' // Sync ref for interval access
    });

    // ------------------------------------------------
    // VEHICLE SIMULATION ENGINE
    // ------------------------------------------------
    useEffect(() => {
        const SPAWN_RATE = 0.20; // Extreme Density
        const SPEED = 2; // px per tick
        const STOP_LINE_OFFSET = 140; // px from center
        const JUNCTION_CENTER = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Road definitions
        // Road 1 (Bottom): Moves Up (Y decreases). Stop Y = CenterY + Offset
        // Road 2 (Left): Moves Right (X increases). Stop X = CenterX - Offset
        // Road 3 (Right): Moves Left (X decreases). Stop X = CenterX + Offset

        const updateSimulation = () => {
            setVehicles(prev => {
                let nextVehicles = prev.map(v => ({ ...v }));
                const currentLights = stateRef.current; // access latest lights from ref to avoid closure issues if using state

                // 1. SPAWN NEW
                // 1. SPAWN NEW
                // A. Ambulance Spawn Logic (Once)
                if (simulationConfig.type === 'ambulance' && !hasSpawnedAmbulance.current) {
                    // Spawn after small delay or immediate
                    hasSpawnedAmbulance.current = true;
                    vehicleIdCounter.current += 1;
                    nextVehicles.push({
                        id: vehicleIdCounter.current,
                        road: simulationConfig.road,
                        progress: 0,
                        state: 'moving',
                        turn: 'straight', // Ambulances go straight usually
                        type: 'ambulance'
                    });
                }

                if (Math.random() < SPAWN_RATE && nextVehicles.length < 60) {
                    const roads = ['r1', 'r2', 'r3'];
                    const road = roads[Math.floor(Math.random() * roads.length)];

                    // Check logic to prevent spawn on top of another
                    const isClear = !nextVehicles.some(v => v.road === road && v.progress < 25);

                    if (isClear) {
                        vehicleIdCounter.current += 1;
                        nextVehicles.push({
                            id: vehicleIdCounter.current,
                            road: road,
                            progress: 0, // 0 = start of road
                            state: 'moving', // moving, stopping, crossing
                            turn: Math.random() > 0.5 ? 'straight' : 'turn', // Intention (R1 must turn)
                            type: 'car'
                        });
                    }
                }

                // 2. MOVE & LOGIC
                nextVehicles = nextVehicles.map(v => {
                    // Logic based on road
                    let shouldStop = false;
                    const distToStop = 350 - v.progress; // Assuming road length approx 500 to junction? 
                    // Let's use coordinate logic relative to screen center for realism, 
                    // but for simple demo, linear progress is easier.
                    // Let's say "Stop Line" is at progress = 100. Junction Exit at 200.

                    const STOP_POINT = 40; // % of screen width/height? 
                    // Let's use % logic easier for responsive.
                    // Road 2 (Left): Starts 0%. Stop Line ~42%. Center 50%.
                    // Road 3 (Right): Starts 100%. Stop Line ~58%. Center 50%.
                    // Road 1 (Bottom): Starts 100%. Stop Line ~58%. Center 50%.

                    let lightState = 'red';
                    if (v.road === 'r1') lightState = currentLights.tl1.state;
                    if (v.road === 'r2') lightState = currentLights.tl3.state; // Road 2 is TL3
                    if (v.road === 'r3') lightState = currentLights.tl2.state; // Road 3 is TL2

                    // Stop Logic
                    // We normalize progress: 0 (Start) -> 100 (Junction Center) -> 200 (Exit)
                    // Stop Line at 80.

                    if (v.progress < 80 && v.progress > 70 && lightState !== 'green' && v.state !== 'crossing') {
                        shouldStop = true;
                    }

                    // Check car ahead
                    const carAhead = nextVehicles.find(o => o.road === v.road && o.progress > v.progress && o.progress < v.progress + 15);
                    if (carAhead) shouldStop = true;

                    if (v.type === 'ambulance') {
                        // AMBULANCE LOGIC
                        // Speed up
                        v.progress += 0.8;

                        // GEO-FENCING DETECTION
                        // Geo-fence starts at progress ~50 (approx 150px from center?)
                        // Stop line is around 80.
                        // If Ambulance > 50 and < 100 (entered zone), trigger Green
                        if (v.progress > 50 && v.progress < 150) {
                            if (!stateRef.current.emergency) {
                                // Trigger Emergency for this road
                                // Need to call a function or set state. 
                                // Since we are in interval, we can't easily call handleEmergencyToggle directly without wrapper.
                                // We'll set a flag in Ref and let the main loop handle it or expose a helper.
                                // Actually, we can just update the Ref directly here for logic, but visual state needs setLights.

                                // Let's use a side-effect via state or a ref callback?
                                // Safest: set a localized state that triggers useEffect, OR just access the handler if defined in scope.
                                // We can't access handleEmergencyToggle here easily as it's defined below.
                                // Workaround: We will use a dedicated effect for detection based on specific vehicle state.
                            }
                        }
                    } else if (!shouldStop) {
                        v.progress += 0.5; // Speed
                        if (v.progress > 85) v.state = 'crossing';
                    }

                    return v;
                }).filter(v => v.progress < 200); // Remove if far past

                return nextVehicles;
            });
        };

        const interval = setInterval(updateSimulation, 50);
        return () => clearInterval(interval);
    }, []);

    // ... (rest of code)

    // Render Helper
    const renderVehicles = () => {
        return vehicles.map(v => {
            // Calculate absolute position based on Road & Progress
            // Center is 50%, 50%
            // Road Width approx 180px -> ~90px offset for lanes
            // We need to be in the "Left" lane (driving on left side of road in India/UK logic? Or Right side US?)
            // Assuming Right-Hand Traffic (US/EU) for now based on stop lines? 
            // Demo image shows stop lines on Right side of road 2... wait.
            // Road 2 (Left) -> Stop line is on top half? No, bottom half usually.
            // Let's look at CSS.
            // Road 2 Stop line: top:90px (Bottom lane). RIGHT HAND TRAFFIC.
            // So Road 2 cars move Left->Right in Bottom Lane.
            // Road 3 Stop line: top:4px (Top lane). Road 3 cars move Right->Left in Top Lane.
            // Road 1 Stop line: Left side of road (top-left if looking from bottom). 
            // Road 1 is Vertical. Stop Vertical line is at left (calc(50% - 120px) ... wait CSS is complex there.

            let top, left, rotation;

            if (v.road === 'r2') {
                // Left Road, Going Right. Bottom Lane.
                // Progress 0 -> Left=0. Progress 100 -> Left=50%.
                left = `${v.progress / 2}%`;
                top = 'calc(50% + 45px)'; // Center of bottom lane
                rotation = 0;

                // Turn Logic at Junction (Progress > 100)
                if (v.progress > 100) {
                    // If turning right (to go Down Road 1? or Up?)
                    // T-Junction: Road 1 is current bottom.
                    // Road 2 can go Straight (to Road 3) or Turn Right (to go Down Road 1?? No that's U-turn).
                    // T-Junction usually: Road 2 (Left) -> Straight to 3, or Turn Right to 1 (Bottom).

                    if (v.turn === 'turn') { // Turn Right to Road 1
                        left = 'calc(50% - 45px)'; // Left lane of Road 1
                        const progressIntoTurn = v.progress - 100;
                        top = `calc(50% + ${progressIntoTurn * 2}%)`;
                        rotation = 90;
                    } else {
                        // Straight
                        left = `${v.progress / 2}%`;
                    }
                }
            }
            else if (v.road === 'r3') {
                // Right Road, Going Left. Top Lane.
                // Progress 0 -> Left=100%. Progress 100 -> Left=50%.
                left = `${100 - (v.progress / 2)}%`;
                top = 'calc(50% - 45px)'; // Center of top lane
                rotation = 180;

                if (v.progress > 100) {
                    // Turn Left (to Road 1)
                    if (v.turn === 'turn') {
                        left = 'calc(50% + 45px)'; // Right lane of Road 1 (Incoming?) No Wait.
                        // Road 1 is bottom. 
                        // If turning Left from Road 3 (Top lane), you cross to ...
                        // Simpler: Just go Straight for now to verify.
                        left = `${100 - (v.progress / 2)}%`;
                    } else {
                        left = `${100 - (v.progress / 2)}%`;
                    }
                }
            }
            else { // r1 (Bottom)
                // Bottom Road, Going Up. Right Lane (from driver perspective facing up).
                // CSS: dashed line vertical center. Stop line?
                // Visuals: Road 1 width 180. Center 50%.
                // Right Lane = Center + 45px.
                left = 'calc(50% + 45px)';
                top = `${100 - (v.progress / 2)}%`;
                rotation = -90;

                // Turn at Junction
                if (v.progress > 100) {
                    // Must turn. Road 1 ends.
                    // Turn Left (to Road 2) or Right (to Road 3).
                    if (v.turn === 'straight') { // Treat 'straight' as Left for logic
                        // Go Left (Road 2, Top Lane)
                        top = 'calc(50% - 45px)';
                        const p = v.progress - 100;
                        left = `calc(50% - ${p * 2}%)`;
                        rotation = -180;
                    } else {
                        // Go Right (Road 3, Bottom Lane)
                        top = 'calc(50% + 45px)';
                        const p = v.progress - 100;
                        left = `calc(50% + ${p * 2}%)`;
                        rotation = 0;
                    }
                }
            }

            return (
                <div key={v.id} style={{
                    position: 'absolute',
                    top: top, left: left,
                    width: '40px', height: '20px',
                    background: v.type === 'ambulance' ? '#fff' : (v.road === 'r1' ? '#3b82f6' : (v.road === 'r2' ? '#ef4444' : '#eab308')), // Color by road
                    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${v.type === 'ambulance' ? 1.2 : 1})`,
                    zIndex: v.type === 'ambulance' ? 20 : 10,
                    borderRadius: '4px',
                    boxShadow: v.type === 'ambulance' ? '0 0 15px rgba(255,0,0,0.6)' : '0 2px 5px rgba(0,0,0,0.3)',
                    transition: 'all 0.05s linear', // Smooth
                    border: v.type === 'ambulance' ? '2px solid red' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {v.type === 'ambulance' && <div style={{ fontSize: '10px' }}>🚑</div>}
                    {/* Headlights */}
                    <div style={{ position: 'absolute', right: 0, top: 0, width: '4px', height: '4px', background: v.type === 'ambulance' ? '#ff0000' : '#ffeb3b', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', right: 0, bottom: 0, width: '4px', height: '4px', background: v.type === 'ambulance' ? '#ff0000' : '#ffeb3b', borderRadius: '50%' }}></div>
                </div>
            );
        });
    };

    // ------------------------------------------------
    // CLOUD SYNC & SERIAL (MASTER OUT)
    // ------------------------------------------------

    // Helper to map state to char
    const mapState = (s) => s === 'green' ? 'G' : (s === 'yellow' ? 'Y' : 'R');

    // 1. SERIAL CONNECT
    const connectSerial = async () => {
        if (!navigator.serial) {
            alert("Web Serial API not supported. Try Chrome/Edge.");
            return;
        }
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            setSerialPort(port);
            setIsSerialConnected(true);
        } catch (err) {
            console.error("Serial/Cloud Error:", err);
        }
    };

    // 3. BROADCASTER (Sends Data whenever Lights Change)
    useEffect(() => {
        const broadcast = async () => {
            const payload = {
                tl1: mapState(lights.tl1),
                tl2: mapState(lights.tl2),
                tl3: mapState(lights.tl3)
            };

            // A. Send to USB (Serial)
            if (serialPort && serialPort.writable) {
                const cmd = `${payload.tl1},${payload.tl2},${payload.tl3}\n`;
                // ... write logic ...
                try {
                    const encoder = new TextEncoder();
                    const writer = serialPort.writable.getWriter();
                    await writer.write(encoder.encode(cmd));
                    writer.releaseLock();
                } catch (err) { console.error("Serial Write Error", err); }
            }

            // B. Send to Cloud (Firebase RTDB)
            if (isCloudSync) {
                try {
                    const trafficRef = dbRef(database, 'traffic_signals/demo_junction');
                    set(trafficRef, payload);
                } catch (err) { console.error("Cloud Sync Error", err); }
            }
        };

        broadcast();
    }, [lights, serialPort, isCloudSync]);




    // Sync Mode state to Ref
    useEffect(() => {
        stateRef.current.mode = mode;
    }, [mode]);

    // ------------------------------------------------
    // TRAFFIC CONTROLLER LOGIC
    // ------------------------------------------------
    useEffect(() => {
        const getPhaseDuration = (id, phase) => {
            return phase === 'green' ? TIMINGS[id].green : TIMINGS[id].yellow;
        };

        const updateRoad = (id, now) => {
            const road = stateRef.current[id];
            const greenDuration = TIMINGS[id].green;
            const yellowDuration = TIMINGS[id].yellow;
            let remaining = 0;

            if (stateRef.current.mode === 'MNL' || stateRef.current.emergency) {
                remaining = 0;
            } else {
                if (road.state === 'green') {
                    const elapsed = now - road.lastChange;
                    if (elapsed >= greenDuration) {
                        stateRef.current[id] = { state: 'yellow', lastChange: now };
                        // Next tick will be yellow
                        return { action: 'update', state: 'yellow', remaining: Math.ceil(yellowDuration / 1000) };
                    }
                    remaining = Math.ceil((greenDuration - elapsed) / 1000);
                }
                else if (road.state === 'yellow') {
                    const elapsed = now - road.lastChange;
                    if (elapsed >= yellowDuration) {
                        stateRef.current[id] = { state: 'red', lastChange: now };
                        return { action: 'update', state: 'red', remaining: 0 };
                    }
                    remaining = Math.ceil((yellowDuration - elapsed) / 1000);
                }
                else {
                    remaining = 0; // Red state handled by global calculator
                }
            }
            return { action: 'tick', remaining };
        };

        const interval = setInterval(() => {
            const now = Date.now();
            const ref = stateRef.current;
            let visualUpdates = {};
            let localRemining = {}; // Stores GREEN/YELLOW remaining for active roads
            let hasUpdate = false;
            let activeRoadId = null;

            if (ref.emergencyMode) {
                setTimers({ tl1: 0, tl2: 0, tl3: 0 });
            }
            else if (ref.mode === 'ATC') {
                // ATC LOGIC

                // 1. Cycle Logic (All Red -> Next Green)
                if (ref.tl1.state === 'red' && ref.tl2.state === 'red' && ref.tl3.state === 'red') {
                    const turn = ref.nextTurn;
                    stateRef.current[turn] = { state: 'green', lastChange: now };
                    visualUpdates[turn] = 'green';
                    hasUpdate = true;

                    // Advance turn pointer: TL1 -> TL3 (Road 2) -> TL2 (Road 3) -> TL1
                    if (turn === 'tl1') stateRef.current.nextTurn = 'tl3';
                    else if (turn === 'tl3') stateRef.current.nextTurn = 'tl2';
                    else stateRef.current.nextTurn = 'tl1';
                }

                // 2. Update States & Capture Remaining Time for Active Road
                ['tl1', 'tl2', 'tl3'].forEach(id => {
                    const res = updateRoad(id, now);
                    if (res.action === 'update') {
                        visualUpdates[id] = res.state;
                        hasUpdate = true;
                    }
                    // Keep track of who is active (non-red)
                    const currentState = visualUpdates[id] || ref[id].state;
                    if (currentState !== 'red') {
                        activeRoadId = id;
                        localRemining[id] = res.remaining;
                    }
                });

                // 3. Calculate RED Light Timers
                // Cycle: tl1 (Road 1) -> tl3 (Road 2) -> tl2 (Road 3) -> tl1
                const getWaitTime = (target, active, activeTimeLeft) => {
                    // Total time per road (Green + Yellow)
                    const dur1 = (TIMINGS.tl1.green + TIMINGS.tl1.yellow) / 1000;
                    const dur3 = (TIMINGS.tl3.green + TIMINGS.tl3.yellow) / 1000; // Road 2
                    const dur2 = (TIMINGS.tl2.green + TIMINGS.tl2.yellow) / 1000; // Road 3

                    if (!active) return 0;

                    // If target is TL1, it waits if TL3 or TL2 is active
                    if (target === 'tl1') {
                        if (active === 'tl2') return activeTimeLeft; // TL2 is right before TL1
                        if (active === 'tl3') return activeTimeLeft + dur2; // TL3 -> TL2 -> TL1
                    }
                    // If target is TL3 (Road 2), it waits if TL1 or TL2 is active
                    if (target === 'tl3') {
                        if (active === 'tl1') return activeTimeLeft; // TL1 is right before TL3
                        if (active === 'tl2') return activeTimeLeft + dur1; // TL2 -> TL1 -> TL3
                    }
                    // If target is TL2 (Road 3), it waits if TL1 or TL3 is active
                    if (target === 'tl2') {
                        if (active === 'tl3') return activeTimeLeft; // TL3 is right before TL2
                        if (active === 'tl1') return activeTimeLeft + dur3; // TL1 -> TL3 -> TL2
                    }
                    return 0;
                };

                const newTimers = { tl1: 0, tl2: 0, tl3: 0 };
                ['tl1', 'tl2', 'tl3'].forEach(id => {
                    const currentState = visualUpdates[id] || ref[id].state;
                    if (currentState !== 'red') {
                        // It's Green or Yellow, use direct countdown
                        newTimers[id] = localRemining[id];
                    } else {
                        // It's Red, calculate wait logic
                        newTimers[id] = getWaitTime(id, activeRoadId, localRemining[activeRoadId] || 0);
                    }
                });

                setTimers(newTimers);
            }
            else {
                setTimers({ tl1: 0, tl2: 0, tl3: 0 });
            }

            if (hasUpdate) {
                setLights(prev => ({ ...prev, ...visualUpdates }));
            }

        }, 100);

        return () => clearInterval(interval);
    }, []);

    // DETECT AMBULANCE IN ZONE
    useEffect(() => {
        const checkGeoFence = () => {
            const amb = vehicles.find(v => v.type === 'ambulance');
            if (amb) {
                // If within range [50, 150] (approaching logic)
                if (amb.progress > 50 && amb.progress < 120) {
                    setAmbulanceDetected(true);
                    // Trigger Emergency for this specific road if not already
                    let targetLight = null;
                    if (amb.road === 'r1') targetLight = 'tl1';
                    else if (amb.road === 'r2') targetLight = 'tl3'; // Recall Road 2 -> TL3 mapping
                    else if (amb.road === 'r3') targetLight = 'tl2'; // Recall Road 3 -> TL2 mapping

                    if (targetLight && emergencyMode !== targetLight) {
                        handleEmergencyToggle(targetLight);
                    }
                } else {
                    setAmbulanceDetected(false);
                    // Auto-disable emergency after passing
                    if (amb.progress > 150 && emergencyMode) {
                        // Turn off emergency
                        handleEmergencyToggle(emergencyMode);
                    }
                }
            }
        };

        checkGeoFence();
    }, [vehicles, emergencyMode]);

    // ------------------------------------------------
    // INPUT HANDLERS
    // ------------------------------------------------
    const handleEmergencyToggle = (roadId) => {
        const ref = stateRef.current;
        if (emergencyMode === roadId) {
            setEmergencyMode(null);
            ref.emergency = false;
            setLights({ tl1: 'red', tl2: 'red', tl3: 'red' });
            ref.tl1.state = 'red'; ref.tl2.state = 'red'; ref.tl3.state = 'red';
        } else {
            setEmergencyMode(roadId);
            ref.emergency = true;
            const newState = { tl1: 'red', tl2: 'red', tl3: 'red' };
            newState[roadId] = 'green';
            setLights(newState);
            ref.tl1.state = newState.tl1;
            ref.tl2.state = newState.tl2;
            ref.tl3.state = newState.tl3;
        }
    };

    const disconnectSerial = async () => {
        if (serialPort) {
            try {
                await serialPort.close();
                setSerialPort(null);
                setIsSerialConnected(false);
            } catch (err) {
                console.error("Disconnection error:", err);
            }
        }
    };

    const handleManualPhase = (roadId) => {
        if (mode !== 'MNL') return;
        const ref = stateRef.current;
        const now = Date.now();
        const newState = { tl1: 'red', tl2: 'red', tl3: 'red' };
        newState[roadId] = 'green';
        setLights(newState);
        ref.tl1 = { state: newState.tl1, lastChange: now };
        ref.tl2 = { state: newState.tl2, lastChange: now };
        ref.tl3 = { state: newState.tl3, lastChange: now };
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#9abea6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* GOOGLE FONT FOR MATRIX DISPLAY */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'); `}
            </style>

            {/* Exit Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute', top: '20px', left: '20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 20px', border: 'none', background: '#fff',
                    borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer',
                    fontWeight: 600, zIndex: 100, fontSize: '0.9rem', color: '#333'
                }}
            >
                <ArrowLeft size={18} /> Exit
            </button>

            {/* CONTROLLER PANEL */}
            <div style={{
                position: 'absolute', top: '20px', right: '20px',
                background: '#fff', padding: '15px', borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100,
                display: 'flex', flexDirection: 'column', gap: '15px',
                width: '240px',
                transition: 'all 0.3s ease'
            }}>
                {/* HEADER & TOGGLE */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isPanelMinimized ? '0' : '5px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#333' }}>CONTROLLER</div>
                    <button
                        onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#666', display: 'flex' }}
                    >
                        {isPanelMinimized ? <Plus size={18} /> : <Minus size={18} />}
                    </button>
                </div>

                {/* CONTENT (Hidden if minimized) */}
                {!isPanelMinimized && (
                    <>
                        {/* 0. HARDWARE LINK REMOVED (ALWAYS CLOUD SYNC) */}


                        {/* 1. Mode Switch */}
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Settings size={14} /> SYSTEM MODE
                            </div>
                            <div style={{ display: 'flex', background: '#eee', borderRadius: '6px', padding: '4px' }}>
                                <button
                                    onClick={() => setMode('ATC')}
                                    style={{
                                        flex: 1, padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                        background: mode === 'ATC' ? '#2563eb' : 'transparent',
                                        color: mode === 'ATC' ? '#fff' : '#666',
                                        fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                    }}
                                >
                                    <Cpu size={14} /> ATC
                                </button>
                                <button
                                    onClick={() => setMode('MNL')}
                                    style={{
                                        flex: 1, padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                        background: mode === 'MNL' ? '#2563eb' : 'transparent',
                                        color: mode === 'MNL' ? '#fff' : '#666',
                                        fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                    }}
                                >
                                    <User size={14} /> MNL
                                </button>
                            </div>
                        </div>

                        {/* 2. Manual Controls (Only in MNL) */}
                        {mode === 'MNL' && (
                            <div style={{ animation: 'fadeIn 0.3s' }}>
                                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>MANUAL PHASE CONTROL</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <button onClick={() => handleManualPhase('tl1')} style={getBtnStyle(lights.tl1 === 'green')}>
                                        OPEN: ROAD 1 (TL1)
                                    </button>
                                    <button onClick={() => handleManualPhase('tl3')} style={getBtnStyle(lights.tl3 === 'green')}>
                                        OPEN: ROAD 2 (TL3)
                                    </button>
                                    <button onClick={() => handleManualPhase('tl2')} style={getBtnStyle(lights.tl2 === 'green')}>
                                        OPEN: ROAD 3 (TL2)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. Emergency (Always Available) */}
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <AlertTriangle size={14} /> EMERGENCY OVERRIDE
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <button onClick={() => handleEmergencyToggle('tl1')} style={getEmergencyBtnStyle(emergencyMode === 'tl1')}>
                                    PRIORITY: ROAD 1
                                </button>
                                <button onClick={() => handleEmergencyToggle('tl3')} style={getEmergencyBtnStyle(emergencyMode === 'tl3')}>
                                    PRIORITY: ROAD 2
                                </button>
                                <button onClick={() => handleEmergencyToggle('tl2')} style={getEmergencyBtnStyle(emergencyMode === 'tl2')}>
                                    PRIORITY: ROAD 3
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* --- LAYOUT VISUALS --- */}
            <style>{`
          .road { background: #151515; position: absolute; display: flex; align-items: center; justify-content: center; }
          .dashed-line-h { position: absolute; width: 100%; height: 2px; background-image: linear-gradient(to right, rgba(255,255,255,0.5) 50%, transparent 50%); background-size: 40px 100%; }
          .dashed-line-v { position: absolute; height: 100%; width: 2px; background-image: linear-gradient(to bottom, rgba(255,255,255,0.5) 50%, transparent 50%); background-size: 100% 40px; }
          .stop-line { position: absolute; background: #fff; }
          .road-label { color: rgba(255,255,255,0.25); fontWeight: 900; font-size: 2.5rem; font-family: 'Oswald', sans-serif; text-transform: uppercase; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

            {/* Horizontal Road */}
            <div className="road" style={{ top: '50%', left: '0', width: '100%', height: '180px', transform: 'translateY(-50%)', zIndex: 1, borderTop: '4px solid #eab308', borderBottom: '4px solid #eab308' }}>
                <div className="dashed-line-h"></div>
                <span className="road-label" style={{ position: 'absolute', left: '15%' }}>-- Road 2 --</span>
                <span className="road-label" style={{ position: 'absolute', right: '15%' }}>-- Road 3 --</span>
                <div className="stop-line" style={{ width: '6px', height: '86px', top: '90px', left: 'calc(50% - 120px)' }}></div>
                <div className="stop-line" style={{ width: '6px', height: '86px', top: '4px', right: 'calc(50% - 120px)' }}></div>
            </div>

            {/* Vertical Road */}
            <div className="road" style={{ bottom: '0', left: '50%', width: '180px', height: '50%', transform: 'translateX(-50%)', zIndex: 1, borderLeft: '4px solid #eab308', borderRight: '4px solid #eab308' }}>
                <div className="dashed-line-v"></div>
                <span className="road-label" style={{ position: 'absolute', bottom: '50px', transform: 'rotate(-90deg)' }}>-- Road 1 --</span>
            </div>

            {/* Junction */}
            <div className="road" style={{ top: '50%', left: '50%', width: '180px', height: '180px', transform: 'translate(-50%, -50%)', zIndex: 2, background: '#151515' }}></div>

            {/* GEO-FENCE VISUALIZATION */}
            {simulationConfig.type === 'ambulance' && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '400px', height: '400px',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    border: `2px dashed ${ambulanceDetected ? '#ef4444' : '#3b82f6'}`,
                    background: ambulanceDetected ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    zIndex: 5,
                    pointerEvents: 'none',
                    animation: 'pulse 2s infinite'
                }}>
                    <div style={{
                        position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                        background: ambulanceDetected ? '#ef4444' : '#3b82f6', color: '#fff',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold'
                    }}>
                        V2X GEO-FENCE ZONE
                    </div>
                </div>
            )}

            {/* VEHICLES */}
            {renderVehicles()}

            {/* Traffic Lights with Timers */}
            <div style={{ position: 'absolute', top: 'calc(50% - 60px)', right: 'calc(50% - 160px)', zIndex: 20 }}>
                <Light status={lights.tl3} label="TL 2" timer={timers.tl3} />
            </div>
            <div style={{ position: 'absolute', top: 'calc(50% - 170px)', left: 'calc(50% - 20px)', zIndex: 20 }}>
                <Light status={lights.tl1} label="TL 1" timer={timers.tl1} />
            </div>
            <div style={{ position: 'absolute', top: 'calc(50% - 60px)', left: 'calc(50% - 160px)', zIndex: 20 }}>
                <Light status={lights.tl2} label="TL 3" timer={timers.tl2} />
            </div>

        </div>
    );
};

// Styles
const getBtnStyle = (isActive) => ({
    padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
    background: isActive ? '#3b82f6' : '#f8f9fa', color: isActive ? '#fff' : '#333',
    boxShadow: isActive ? 'inset 0 2px 5px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
});

const getEmergencyBtnStyle = (isActive) => ({
    padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
    background: isActive ? '#ef4444' : '#fff0f0', color: isActive ? '#fff' : '#c0392b',
    boxShadow: isActive ? 'inset 0 2px 5px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
});

const Light = ({ status, label, timer }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transform: 'scale(0.8)' }}>

        {/* TIMER DISPAY - Matrix Style */}
        <div style={{
            background: '#000',
            padding: '2px 6px',
            minWidth: '40px',
            textAlign: 'center',
            borderRadius: '4px',
            color: timer > 0 ? (status === 'yellow' ? '#facc15' : (status === 'green' ? '#22c55e' : '#ef4444')) : '#333',
            border: '1px solid #333',
            fontFamily: "'Share Tech Mono', monospace", // Digital Font
            fontSize: '1.2rem',
            lineHeight: '1',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
            textShadow: timer > 0 ? '0 0 5px currentColor' : 'none'
        }}>
            {timer > 0 ? (timer < 10 ? `0${timer} ` : timer) : '--'}
        </div>

        <div style={{ background: '#000', padding: '2px 8px', borderRadius: '2px', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', fontFamily: 'monospace' }}>{label}</div>
        <div style={{ background: '#222', borderRadius: '8px', padding: '6px', border: '2px solid #555', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['red', 'yellow', 'green'].map(color => (
                <div key={color} style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: status === color ? (color === 'red' ? '#ff3b30' : color === 'yellow' ? '#ffcc00' : '#34c759') : '#333',
                    boxShadow: status === color ? `0 0 15px ${color === 'red' ? '#ff3b30' : color === 'yellow' ? '#ffcc00' : '#34c759'} ` : 'none',
                    opacity: status === color ? 1 : 0.3
                }} />
            ))}
        </div>
    </div>
);

export default DemoPage;
