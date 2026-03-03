const functions = require('firebase-functions');
const admin = require('firebase-admin');

// ---------------------------------------------------------
// GEO-MATH UTILITY (Haversine & Ray Casting)
// ---------------------------------------------------------

// Helper: Calculate distance in meters between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper: Point in Polygon (Ray Casting algorithm)
// polygon is array of {lat, lng}
function isPointInPolygon(pointLat, pointLng, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > pointLng) !== (yj > pointLng)) &&
            (pointLat < (xj - xi) * (pointLng - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }

    return isInside;
}

admin.initializeApp();
const db = admin.firestore();

exports.checkAmbulanceGeofences = functions.database.ref('/ambulances/{uid}/location')
    .onWrite(async (change, context) => {
        const locationData = change.after.val();

        // If data was deleted (ambulance went offline) or no status, do nothing special for now.
        // We could theoretically clear the emergency state, but we'll let the frontend handle normal cycles.
        if (!locationData || locationData.status !== 'on_mission' || !locationData.lat || !locationData.lng) {
            return null;
        }

        const ambLat = parseFloat(locationData.lat);
        const ambLng = parseFloat(locationData.lng);

        console.log(`Checking geofences for ambulance ${context.params.uid} at ${ambLat}, ${ambLng}`);

        try {
            // 1. Fetch All Geofenced Signals
            // In a huge city scenario, we'd query by region. For this scale, fetch all signals with a geofence.
            const signalsSnapshot = await db.collection("signals").get();
            const signals = [];
            signalsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.geofence) {
                    signals.push({ id: doc.id, ...data });
                }
            });

            if (signals.length === 0) return null;

            // 2. Check Intersections
            let triggeredSignalId = null;
            let targetJunctionId = null;

            for (const signal of signals) {
                if (signal.geofence.type === 'polygon' && signal.geofence.coordinates) {
                    // Check Polygon Contains
                    if (isPointInPolygon(ambLat, ambLng, signal.geofence.coordinates)) {
                        triggeredSignalId = signal.id;
                        targetJunctionId = signal.junctionId;
                        break; // Stop checking, we found the zone they entered
                    }
                } else if (signal.geofence.type === 'circle' && signal.geofence.center && signal.geofence.radius) {
                    // Fallback to circle just in case someone used one
                    const dist = getDistance(ambLat, ambLng, signal.geofence.center.lat, signal.geofence.center.lng);
                    if (dist <= signal.geofence.radius) {
                        triggeredSignalId = signal.id;
                        targetJunctionId = signal.junctionId;
                        break;
                    }
                }
            }

            // 3. Update FireStore Signals if a Trigger occured
            if (triggeredSignalId && targetJunctionId) {
                console.log(`[EMERGENCY TRIGGER] Ambulance inside Signal ${triggeredSignalId} zone (Junction ${targetJunctionId})`);

                // Get all signals belonging to this junction to turn them red
                const junctionSignalsSnap = await db.collection("signals")
                    .where("junctionId", "==", targetJunctionId)
                    .get();

                const batch = db.batch();

                junctionSignalsSnap.forEach(doc => {
                    const signalRef = db.collection("signals").doc(doc.id);
                    if (doc.id === triggeredSignalId) {
                        // The road the ambulance is approaching
                        batch.update(signalRef, {
                            state: 'green',
                            emergencyOverride: true,
                            lastOverrideAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // The cross streets
                        batch.update(signalRef, {
                            state: 'red',
                            emergencyOverride: true,
                            lastOverrideAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });

                await batch.commit();
                console.log(`Signals updated successfully.`);
            }

        } catch (error) {
            console.error("Error evaluating geofences:", error);
        }

        return null;
    });
