import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx4FmTDYmbb14eB67fu5k8zPw9LU9MbDw",
    authDomain: "kitab-kada-009.firebaseapp.com",
    projectId: "kitab-kada-009",
    storageBucket: "kitab-kada-009.firebasestorage.app",
    messagingSenderId: "740354954726",
    appId: "1:740354954726:web:24828ae9a39251751eb227"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const grid = document.getElementById('books-grid-ar');

async function loadBooks() {
    try {
        const q = query(collection(db, "books"), where("category", "==", "arabic"));
        const snapshot = await getDocs(q);
        grid.innerHTML = '';

        if (snapshot.empty) {
            grid.innerHTML = '<p id="loading-spinner">No Arabic books found yet.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const book = doc.data();
            grid.innerHTML += `
                <div class="book-card">
                    <img src="${book.cover}" alt="${book.title}">
                    <h3>${book.title}</h3>
                    <a href="${book.link}" target="_blank" class="read-btn">Read Now</a>
                </div>`;
        });
    } catch (e) {
        grid.innerHTML = '<p id="loading-spinner">Error loading library.</p>';
    }
}
loadBooks();