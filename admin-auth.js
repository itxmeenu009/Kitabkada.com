// Admin Authentication Checker
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if user is admin
async function checkAdminAccess(user) {
    if (!user) {
        window.location.href = "loginpage.html";
        return false;
    }

    try {
        const userDoc = await getDoc(doc(db, "admins", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
            alert("Access Denied: You are not an admin.");
            await signOut(auth);
            window.location.href = "loginpage.html";
            return false;
        }
        return true;
    } catch (error) {
        console.error("Admin check failed:", error);
        window.location.href = "loginpage.html";
        return false;
    }
}

// Add admin user to Firestore (Run this ONCE to set up admin)
async function setupAdminUser(email, password) {
   
}

export { auth, db, checkAdminAccess };