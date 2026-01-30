// Main application entry point
// This file orchestrates all Firebase initialization and app setup

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDq_DgP_ST72HVYGQfm0AtjUOFgeUdM1I",
    authDomain: "africhic-garments.firebaseapp.com",
    projectId: "africhic-garments",
    storageBucket: "africhic-garments.firebasestorage.app",
    messagingSenderId: "877967489386",
    appId: "1:877967489386:web:9ae436b5acba106c930d13",
    measurementId: "G-CRE5H4XVLY"
};

console.log('[App] Initializing Africhic Garments application...');

try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('[Firebase] ✓ App initialized');
    
    // Initialize services
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    const analytics = getAnalytics(app);
    
    // Export for use in other modules
    window.firebaseApp = app;
    window.db = db;
    window.auth = auth;
    window.storage = storage;
    window.firebaseInitialized = true;
    window.firebaseError = null;
    
    console.log('[Firebase] ✓ All services initialized');
    console.log('[Firebase] - Firestore: Ready');
    console.log('[Firebase] - Auth: Ready');
    console.log('[Firebase] - Storage: Ready');
    console.log('[Firebase] - Analytics: Ready');
    
    // Enable offline persistence
    try {
        await enableIndexedDbPersistence(db);
        console.log('[Firebase] ✓ Offline persistence enabled');
    } catch (err) {
        if (err.code === 'failed-precondition') {
            console.warn('[Firebase] Multiple tabs open - persistence disabled');
        } else if (err.code === 'unimplemented') {
            console.warn('[Firebase] Browser does not support offline persistence');
        }
    }
    
    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('[Auth] User logged in:', user.email);
            window.currentUser = user;
            // Dispatch custom event for auth change
            window.dispatchEvent(new CustomEvent('auth-login', { detail: user }));
        } else {
            console.log('[Auth] User logged out');
            window.currentUser = null;
            window.dispatchEvent(new CustomEvent('auth-logout'));
        }
    });
    
    console.log('[App] ✓ Application initialized successfully');
    
} catch (error) {
    console.error('[Firebase] ✗ Initialization failed:', error);
    window.firebaseInitialized = false;
    window.firebaseError = error.message;
}

// Export initialization status
export const getFirebaseStatus = () => ({
    initialized: window.firebaseInitialized,
    error: window.firebaseError,
    db: window.db,
    auth: window.auth,
    storage: window.storage
});
