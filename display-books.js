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
const booksGrid = document.getElementById('books-grid');

async function loadUrduBooks() {
    try {
        // Only fetch books where category is 'urdu'
        const q = query(collection(db, "books"), where("category", "==", "urdu"));
        const querySnapshot = await getDocs(q);
        
        booksGrid.innerHTML = ''; // Clear loading message

        if (querySnapshot.empty) {
            booksGrid.innerHTML = '<p id="loading-spinner">No books found in this category yet.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const book = doc.data();
            const bookHTML = `
                <div class="book-card">
                    <img src="${book.cover}" alt="${book.title}">
                    <h3>${book.title}</h3>
                    <a href="${book.link}" target="_blank" class="read-btn">Read Now</a>
                </div>
            `;
            booksGrid.innerHTML += bookHTML;
        });
    } catch (error) {
        console.error("Error loading books: ", error);
        booksGrid.innerHTML = '<p id="loading-spinner">Error loading library. Please try again.</p>';
    }
}

loadUrduBooks();