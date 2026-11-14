// Inicialización de Firebase (la apiKey web es pública; la seguridad la dan las reglas de Firestore).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyAqDw9XcUEJweHuG91N-xsruZDQKRi_ERU",
  authDomain: "arena-79185.firebaseapp.com",
  projectId: "arena-79185",
  storageBucket: "arena-79185.firebasestorage.app",
  messagingSenderId: "120383178917",
  appId: "1:120383178917:web:1f5b2ecf62dc779ac8654c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
