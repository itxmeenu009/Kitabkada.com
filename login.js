import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔥 Login page loaded");

// Admin UIDs for fallback
const adminUIDs = [
    'gJk8UGx2q7PJYix3hCZEBoRn5fS2',   // n03285520430@gmail.com
    'C4yHR3ac4oY5td4P57ci6aeSsLt2',   // su92-bssem-f24-186@superior.edu.pk
    'awce2sEs61QSVhPwb5zR9NCjVl83'    // noorijopu89@gmail.com
];

// ==================== PASSWORD TOGGLE ====================
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        if (type === 'text') {
            togglePassword.classList.remove('bx-hide');
            togglePassword.classList.add('bx-show');
        } else {
            togglePassword.classList.remove('bx-show');
            togglePassword.classList.add('bx-hide');
        }
    });
}

// ==================== LOGIN ====================
const loginForm = document.getElementById('login-form');
const errorDiv = document.getElementById('error-message');
const successDiv = document.getElementById('success-message');
const loginBtn = document.getElementById('login-btn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Reset messages
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        // Basic validation
        if (!email || !password) {
            errorDiv.textContent = 'Please enter email and password.';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters.';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Disable button
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        
        try {
            // Step 1: Sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            console.log("✅ Signed in:", user.email, "UID:", user.uid);
            
            // Step 2: Check if UID is admin
            if (adminUIDs.includes(user.uid)) {
                // SUCCESS - is admin by UID
                console.log("✅ Admin verified by UID");
                
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', user.email);
                
                successDiv.textContent = 'Login successful! Redirecting...';
                successDiv.style.display = 'block';
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.replace("admin-upload.html");
                }, 800);
                
            } else {
                // Try Firestore check
                try {
                    const adminDoc = await getDoc(doc(db, "admins", user.uid));
                    
                    if (adminDoc.exists() && adminDoc.data().role === "admin") {
                        console.log("✅ Admin verified by Firestore");
                        
                        localStorage.setItem('adminLoggedIn', 'true');
                        localStorage.setItem('adminEmail', user.email);
                        
                        successDiv.textContent = 'Login successful! Redirecting...';
                        successDiv.style.display = 'block';
                        
                        setTimeout(() => {
                            window.location.replace("admin-upload.html");
                        }, 800);
                        
                    } else {
                        throw new Error("Not admin");
                    }
                } catch (fsError) {
                    console.error("Not admin:", fsError);
                    await auth.signOut();
                    errorDiv.textContent = 'Access Denied: You are not an admin.';
                    errorDiv.style.display = 'block';
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Sign In';
                }
            }
            
        } catch (authError) {
            console.error("❌ Login failed:", authError.code);
            
            let message = 'Login failed. Please try again.';
            
            switch (authError.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password.';
                    break;
                case 'auth/invalid-credential':
                    message = 'You are not admin.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email format.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many attempts. Try again later.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Check your connection.';
                    break;
            }
            
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });
}

// ==================== AUTO LOGIN CHECK ====================
// Only check once on page load
let authCheckDone = false;

onAuthStateChanged(auth, (user) => {
    // Prevent multiple checks
    if (authCheckDone) return;
    
    if (user) {
        console.log("👤 User already signed in:", user.email);
        
        // Quick UID check first
        if (adminUIDs.includes(user.uid)) {
            authCheckDone = true;
            console.log("✅ Admin, redirecting to upload page");
            window.location.replace("admin-upload.html");
            return;
        }
        
        // Check Firestore
        getDoc(doc(db, "admins", user.uid))
            .then((docSnap) => {
                if (docSnap.exists() && docSnap.data().role === "admin") {
                    authCheckDone = true;
                    console.log("✅ Admin (Firestore), redirecting");
                    window.location.replace("admin-upload.html");
                } else {
                    // Signed in but not admin, sign out
                    auth.signOut();
                }
            })
            .catch(() => {
                console.log("⚠️ Could not verify, staying on login page");
            });
    } else {
        console.log("👤 No user signed in");
    }
});