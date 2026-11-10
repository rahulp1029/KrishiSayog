import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCrzETwB0JEYW08D7uySwKCRLL6YyMis1I",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "krishisayog.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "krishisayog",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "krishisayog.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "437805911623",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:437805911623:web:44cdab435a534baa52b62"
};

// Initialize Firebase only if config exists
let app;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;
let githubProvider: any = null;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    githubProvider = new GithubAuthProvider();
} catch (error) {
    console.warn("Firebase config is missing or invalid. Auth features will be disabled.");
}

export { auth, db, googleProvider, githubProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc, serverTimestamp };

