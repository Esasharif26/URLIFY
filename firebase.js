import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAOnfAeqqvXTg4v3lVCAJw-1cdf0E4dWjM",
  authDomain: "urlify-d1a76.firebaseapp.com",
  projectId: "urlify-d1a76",
  storageBucket: "urlify-d1a76.firebasestorage.app",
  messagingSenderId: "368616323783",
  appId: "1:368616323783:web:3917f7c0e2dce14b9cdce2",
  measurementId: "G-X446WX5ZY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { auth };