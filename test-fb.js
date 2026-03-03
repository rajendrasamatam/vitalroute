import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDVGw2L6567Mu2taEJ4F8wB0utM4WBbh54",
    authDomain: "studio-9661130949-2b190.firebaseapp.com",
    projectId: "studio-9661130949-2b190",
    storageBucket: "studio-9661130949-2b190.firebasestorage.app",
    messagingSenderId: "162383979190",
    appId: "1:162383979190:web:f0898fc093a0f6d319fc17"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkJunction() {
    try {
        const id = "g28IVSFPC1SxkOjOs814"; // From screenshot
        const docRef = doc(db, 'junctions', id);
        const docSnap = await getDoc(docRef);
        console.log("EXISTS:", docSnap.exists());
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("RAW DATA:");
            console.log(JSON.stringify(data, null, 2));
            console.log("location type:", typeof data.location, data.location?.constructor?.name);
            console.log("centerLocation type:", typeof data.centerLocation, data.centerLocation?.constructor?.name);
        }
    } catch (e) {
        console.error("ERROR", e);
    }
    process.exit(0);
}

checkJunction();
