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
    'gJk8UGx2q7PJYix3hCZEBoRn5fS2',   // n03285520430@gmail.com
    'C4yHR3ac4oY5td4P57ci6aeSsLt2',   // su92-bssem-f24-186@superior.edu.pk
    'awce2sEs61QSVhPwb5zR9NCjVl83'    // noorijopu89@gmail.com
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
        
        // Hide previous messages
        successDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        // Get values
        const title = document.getElementById('bookTitle').value.trim();
        const category = document.getElementById('bookCategory').value;
        const cover = document.getElementById('coverUrl').value.trim();
        const link = document.getElementById('downloadUrl').value.trim();
        
        // ==================== VALIDATION ====================
        
        // Check empty fields
        if (!title) {
            showError('⚠️ Please enter the book title.');
            document.getElementById('bookTitle').focus();
            return;
        }
        
        if (!cover) {
            showError('⚠️ Please enter the cover image URL.');
            document.getElementById('coverUrl').focus();
            return;
        }
        
        if (!link) {
            showError('⚠️ Please enter the download/read URL.');
            document.getElementById('downloadUrl').focus();
            return;
        }
        
        // Validate cover URL
        if (!cover.startsWith('http://') && !cover.startsWith('https://')) {
            showError('⚠️ Cover URL must start with http:// or https://');
            document.getElementById('coverUrl').focus();
            return;
        }
        
        // Validate download URL
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
            showError('⚠️ Download URL must start with http:// or https://');
            document.getElementById('downloadUrl').focus();
            return;
        }
        
        // Check for broken Google Drive links
        if (link.includes('&ec=') || link.includes('[module]') || link.includes('wgc-drive')) {
            showError('⚠️ Invalid Google Drive link. Go to Drive → Right-click → Share → Copy link.');
            document.getElementById('downloadUrl').focus();
            return;
        }
        
        // Check for common invalid patterns
        if (link.includes('...') || link.includes(' ')) {
            showError('⚠️ URL contains invalid characters (spaces or dots). Please check the link.');
            document.getElementById('downloadUrl').focus();
            return;
        }
        
        // ==================== SAVE TO FIRESTORE ====================
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bx bx-loader bx-spin"></i> Saving...';
        
        try {
            const bookData = {
                title: title,
                category: category,
                cover: cover,
                link: link,
                addedBy: auth.currentUser ? auth.currentUser.email : 'unknown',
                timestamp: new Date()
            };
            
            console.log("📚 Saving book:", bookData);
            
            await addDoc(collection(db, "books"), bookData);
            
            console.log("✅ Book saved successfully!");
            
            // Show success
            successDiv.textContent = `✅ "${title}" added to ${category} books!`;
            successDiv.style.display = 'block';
            
            // Reset form
            form.reset();
            
            // Scroll to top to see success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Hide success after 5 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
            
        } catch (error) {
            console.error("❌ Error saving book:", error);
            
            let errorMsg = '❌ Error saving book.';
            
            if (error.code === 'permission-denied') {
                errorMsg = '❌ Permission denied. Please login again.';
            } else if (error.code === 'unavailable') {
                errorMsg = '❌ Network error. Check your internet connection.';
            } else {
                errorMsg = `❌ Error: ${error.message}`;
            }
            
            showError(errorMsg);
            
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Book to Library';
        }
    });
    
    // Helper function
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        
        // Auto hide after 8 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 8000);
    }
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
