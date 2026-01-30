// Firebase SDK Compat Configuration
// Using compat version for compatibility with existing code

console.log('[Firebase] Initializing Firebase SDK (Compat)...');

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDq_DgP_ST72HVYGQfm0AtjUOFgeUdM1I",
    authDomain: "africhic-garments.firebaseapp.com",
    projectId: "africhic-garments",
    storageBucket: "africhic-garments.firebasestorage.app",
    messagingSenderId: "877967489386",
    appId: "1:877967489386:web:9ae436b5acba106c930d13",
    measurementId: "G-CRE5H4XVLY"
};

try {
    // Initialize Firebase using compat SDK
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] ✓ App initialized');
    
    // Get references to services
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.storage = firebase.storage();
    
    window.firebaseInitialized = true;
    window.firebaseError = null;
    
    console.log('[Firebase] ✓ SUCCESS - All services ready');
    console.log('[Firebase] - Firestore:', typeof window.db);
    console.log('[Firebase] - Auth:', typeof window.auth);
    console.log('[Firebase] - Storage:', typeof window.storage);
    
    // Enable offline persistence
    window.db.enablePersistence()
        .then(() => {
            console.log('[Firebase] ✓ Offline persistence enabled');
            // Try to load products for guests immediately (no auth needed)
            loadProductsFromFirestore().then(products => {
                if (products && products.length > 0) {
                    localStorage.setItem('africhic-products', JSON.stringify(products));
                    console.log('[Firebase] ✓ Pre-loaded', products.length, 'products for guest access');
                }
            }).catch(err => {
                console.log('[Firebase] Guest product pre-load failed (not critical):', err.message);
            });
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('[Firebase] Multiple tabs open, persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('[Firebase] Offline persistence not supported in this browser');
            }
        });
    
} catch (error) {
    console.error('[Firebase] ✗ ERROR - Initialization failed:', error.message);
    window.firebaseInitialized = false;
    window.firebaseError = error.message;
}

// Ensure Firebase is ready before using it
function ensureFirebaseReady(maxWaitMs = 10000) {
    return new Promise(async (resolve) => {
        if (window.firebaseInitialized && window.db && window.auth) {
            console.log('[Firebase] Already initialized');
            resolve(true);
            return;
        }
        
        console.log('[Firebase] Waiting for initialization (max', maxWaitMs, 'ms)...');
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitMs) {
            if (window.firebaseInitialized && window.db && window.auth) {
                console.log('[Firebase] ✓ Now initialized after', Date.now() - startTime, 'ms');
                // Initialize real-time sync once Firebase is ready
                if (window.firestoreSync) {
                    window.firestoreSync.init().then(() => {
                        console.log('[Firebase] ✓ Firestore sync initialized');
                    }).catch(err => {
                        console.error('[Firebase] Error initializing sync:', err);
                    });
                }
                resolve(true);
                return;
            }
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.error('[Firebase] ✗ Timeout - Firebase not initialized after', maxWaitMs, 'ms');
        console.log('[Firebase] Final state - initialized:', window.firebaseInitialized, 'db:', typeof window.db, 'auth:', typeof window.auth);
        resolve(false);
    });
}

// Load products from Firestore - with proper error handling
async function loadProductsFromFirestore() {
    try {
        if (!window.db) {
            console.error("Firestore not initialized");
            // Try waiting for Firebase to be ready
            await ensureFirebaseReady();
            if (!window.db) return [];
        }
        const productsSnapshot = await window.db.collection('products').get();
        const products = [];
        productsSnapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log('[Firestore] Loaded', products.length, 'products');
        return products;
    } catch (error) {
        console.error("Error loading products:", error);
        return [];
    }
}

// Add product to Firestore - with proper error handling
async function addProductToFirestore(product) {
    try {
        if (!window.db) {
            console.error("Firestore not initialized");
            await ensureFirebaseReady();
            if (!window.db) return false;
        }
        // Ensure product has required fields
        if (!product.id) {
            product.id = Date.now().toString();
        }
        await window.db.collection('products').doc(product.id).set(product);
        console.log('[Firestore] Product added:', product.id);
        return true;
    } catch (error) {
        console.error("Error adding product:", error);
        alert("Error adding product: " + error.message);
        return false;
    }
}

// Delete product from Firestore - with proper error handling
async function deleteProductFromFirestore(productId) {
    try {
        if (!window.db) {
            console.error("Firestore not initialized");
            await ensureFirebaseReady();
            if (!window.db) return false;
        }
        await window.db.collection('products').doc(productId).delete();
        console.log('[Firestore] Product deleted:', productId);
        return true;
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product: " + error.message);
        return false;
    }
}

// Update product in Firestore - with proper error handling
async function updateProductInFirestore(productId, updatedData) {
    try {
        if (!window.db) {
            console.error("Firestore not initialized");
            await ensureFirebaseReady();
            if (!window.db) return false;
        }
        await window.db.collection('products').doc(productId).update(updatedData);
        console.log('[Firestore] Product updated:', productId);
        return true;
    } catch (error) {
        console.error("Error updating product:", error);
        alert("Error updating product: " + error.message);
        return false;
    }
}

// Real-time listener for products across all devices
function listenToProductsRealTime(callback) {
    if (!window.db) {
        console.error('[Firestore] DB not ready for real-time listener');
        return null;
    }
    
    console.log('[Firestore] Setting up real-time product listener');
    
    return window.db.collection('products')
        .onSnapshot(
            (snapshot) => {
                const products = [];
                snapshot.forEach(doc => {
                    products.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                console.log('[Firestore] Real-time update: products changed to', products.length);
                if (callback) callback(products);
            },
            (error) => {
                console.error('[Firestore] Real-time listener error:', error);
            }
        );
}
