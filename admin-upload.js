import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Admin Upload page loaded");

// Admin UIDs for fallback
const adminUIDs = [
    'gJk8UGx2q7PJYix3hCZEBoRn5fS2',
    'C4yHR3ac4oY5td4P57ci6aeSsLt2',
    'awce2sEs61QSVhPwb5zR9NCjVl83'
];

// Prevent redirect loop
let authChecked = false;

// ==================== CHECK AUTH ====================
onAuthStateChanged(auth, async (user) => {
    // Prevent infinite loop
    if (authChecked) return;
    
    if (!user) {
        // No user, redirect to login
        console.log("❌ No user, redirecting to login");
        authChecked = true;
        window.location.replace("loginpage.html");
        return;
    }
    
    console.log("👤 Checking admin:", user.email);
    
    // Check by UID first (fast)
    if (adminUIDs.includes(user.uid)) {
        console.log("✅ Admin verified by UID");
        document.getElementById('admin-email-display').textContent = `Admin: ${user.email}`;
        authChecked = true;
        enableForm();
        return;
    }
    
    // Check Firestore
    try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (adminDoc.exists() && adminDoc.data().role === "admin") {
            console.log("✅ Admin verified by Firestore");
            document.getElementById('admin-email-display').textContent = `Admin: ${user.email}`;
            authChecked = true;
            enableForm();
        } else {
            console.log("❌ Not admin");
            await signOut(auth);
            authChecked = true;
            window.location.replace("loginpage.html");
        }
    } catch (error) {
        console.error("❌ Firestore check failed:", error);
        
        // If Firestore fails but user is logged in, check UID again
        if (adminUIDs.includes(user.uid)) {
            console.log("✅ Admin (fallback)");
            document.getElementById('admin-email-display').textContent = `Admin: ${user.email}`;
            authChecked = true;
            enableForm();
        } else {
            await signOut(auth);
            authChecked = true;
            window.location.replace("loginpage.html");
        }
    }
});

// ==================== ENABLE FORM ====================
function enableForm() {
    const form = document.getElementById('upload-form');
    const submitBtn = document.getElementById('submit-btn');
    const successDiv = document.getElementById('success-message');
    const errorDiv = document.getElementById('error-message');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        successDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        const title = document.getElementById('bookTitle').value.trim();
        const category = document.getElementById('bookCategory').value;
        const cover = document.getElementById('coverUrl').value.trim();
        const link = document.getElementById('downloadUrl').value.trim();
        
        // Validation
        if (!title || !cover || !link) {
            errorDiv.textContent = '⚠️ Please fill all fields.';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!cover.startsWith('http')) {
            errorDiv.textContent = '⚠️ Please enter a valid Cover Image URL.';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!link.startsWith('http')) {
            errorDiv.textContent = '⚠️ Please enter a valid Download/Read URL.';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        try {
            const bookData = {
                title: title,
                category: category,
                cover: cover,
                link: link,
                addedBy: auth.currentUser ? auth.currentUser.email : 'unknown',
                timestamp: new Date()
            };
            
            await addDoc(collection(db, "books"), bookData);
            
            console.log("✅ Book added:", title);
            
            successDiv.textContent = `✅ "${title}" added successfully to ${category} books!`;
            successDiv.style.display = 'block';
            
            // Reset form
            form.reset();
            
            // Hide success after 5 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
            
        } catch (error) {
            console.error("❌ Error adding book:", error);
            errorDiv.textContent = `❌ Error: ${error.message}`;
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Book to Library';
        }
    });
}

// ==================== LOGOUT ====================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            console.log("👋 Logged out");
            window.location.replace("loginpage.html");
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}