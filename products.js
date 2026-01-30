// Products are now managed through the Admin Product Management panel
// All products are synced across devices via Firestore

// Default inventory for demo purposes
const defaultInventory = [
    {
        id: 'PROD-1',
        name: "Kente Royal Wrap Dress",
        category: "ladies-dresses",
        price: 850.00,
        stock: 10,
        sizes: ["S", "M", "L"],
        colours: ["Gold", "Blue", "Red"],
        description: "Elegant wrap dress featuring authentic Ghanaian Kente patterns.",
        image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'PROD-2',
        name: "Ankara Men's Slim-Fit",
        category: "men-shirts",
        price: 550.00,
        stock: 15,
        sizes: ["M", "L", "XL"],
        colours: ["Orange", "Green", "Purple"],
        description: "100% cotton tailored shirt with vibrant geometric prints.",
        image: "https://images.unsplash.com/photo-1530008051860-ca82035a1609?auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'PROD-3',
        name: "High-Waist Peplum Skirt",
        category: "ladies-skirts",
        price: 450.00,
        stock: 8,
        sizes: ["XS", "S", "M"],
        colours: ["Black", "White", "Brown"],
        description: "Traditional print with a modern peplum flare, perfect for events.",
        image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let inventory = [];
let realtimeListenerActive = false;
let displayProductsCallback = null;

// Initialize products on script load (before DOM ready)
console.log('📦 Products.js initializing...');

// Register callback for when products should be displayed
function onProductsReady(callback) {
    displayProductsCallback = callback;
    // If inventory already loaded, call immediately
    if (inventory.length > 0 && typeof callback === 'function') {
        setTimeout(() => callback(inventory), 0);
    }
}

// Immediately set up real-time listener for ALL pages
function setupProductRealTimeListener() {
    if (realtimeListenerActive) {
        console.log('ℹ Real-time listener already active');
        return;
    }
    
    // Wait for Firebase
    let checkCount = 0;
    const setupInterval = setInterval(() => {
        checkCount++;
        if (window.db || checkCount > 30) { // 30 checks = 15 seconds max
            clearInterval(setupInterval);
            
            if (!window.db) {
                console.log('⚠ Firebase not available, will use cached products');
                // Try to load from cache immediately
                loadInventoryFromCache();
                return;
            }
            
            console.log('🔄 Setting up real-time products listener...');
            realtimeListenerActive = true;
            
            // Set up real-time listener that runs for the lifetime of the page
            window.db.collection('products').onSnapshot(
                (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    console.log('📦 Real-time update - Products available:', products.length);
                    if (products.length > 0) {
                        inventory = products;
                        localStorage.setItem('africhic-products', JSON.stringify(products));
                        console.log('✓ Inventory updated:', products.length, 'items');
                        
                        // Trigger display callback if registered
                        if (typeof displayProductsCallback === 'function') {
                            displayProductsCallback(inventory);
                        }
                        // Also dispatch custom event
                        window.dispatchEvent(new CustomEvent('productsLoaded', {
                            detail: { products: products }
                        }));
                    } else {
                        console.log('⚠ No products in Firestore yet');
                    }
                },
                (error) => {
                    console.log('ℹ Real-time listener error:', error.message);
                }
            );
            
            // Try initial load from Firestore
            loadInventoryFromFirebase();
        }
    }, 500);
}

// Load from cache immediately (for offline/instant access)
function loadInventoryFromCache() {
    const cached = localStorage.getItem('africhic-products');
    if (cached) {
        try {
            inventory = JSON.parse(cached);
            console.log('✓ Loaded from cache:', inventory.length, 'products');
            if (typeof displayProductsCallback === 'function') {
                displayProductsCallback(inventory);
            }
        } catch (e) {
            console.error('Error loading cache:', e);
        }
    }
}

// Load products from Firestore (synced across devices)
async function loadInventoryFromFirebase() {
    try {
        console.log('🔄 Loading products from Firestore...');
        
        // FIRST: Try Firestore immediately (works for all users, no auth needed)
        if (window.db) {
            const products = await getProductsFromFirestore();
            if (products && products.length > 0) {
                inventory = products;
                localStorage.setItem('africhic-products', JSON.stringify(products));
                console.log('✓ Loaded from Firestore:', inventory.length, 'products');
                
                // Trigger callback
                if (typeof displayProductsCallback === 'function') {
                    displayProductsCallback(inventory);
                }
                return true;
            } else {
                console.log('⚠ No products in Firestore');
            }
        }
        
        // SECOND: Fall back to localStorage (returning users, offline access)
        const storedProducts = localStorage.getItem('africhic-products');
        if (storedProducts) {
            try {
                inventory = JSON.parse(storedProducts);
                console.log('✓ Loaded from localStorage:', inventory.length, 'products');
                
                // Trigger callback
                if (typeof displayProductsCallback === 'function') {
                    displayProductsCallback(inventory);
                }
                return true;
            } catch (e) {
                console.error('Error parsing stored products:', e);
            }
        }

        // THIRD: Fall back to default inventory (for demo purposes)
        console.log('✓ Using default inventory for demo purposes');
        inventory = defaultInventory;
        localStorage.setItem('africhic-products', JSON.stringify(defaultInventory));
        
        // Trigger callback
        if (typeof displayProductsCallback === 'function') {
            displayProductsCallback(defaultInventory);
        }
        return true;

    } catch (error) {
        console.error("Error loading products:", error);
        inventory = [];
        return false;
    }
}

// Get products from Firestore (NO authentication required - public read)
async function getProductsFromFirestore() {
    try {
        if (!window.db) {
            console.log('⚠ Firestore not initialized');
            return null;
        }
        
        console.log('🔄 Fetching products from Firestore...');
        const snapshot = await window.db.collection('products').get();
        const products = [];
        
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✓ Retrieved', products.length, 'products from Firestore (public access)');
        return products;
    } catch (error) {
        console.error('Error getting products from Firestore:', error.message);
        console.log('⚠ Firestore retrieval failed - this is expected for guests without internet');
        return null;
    }
}

// Sync products from Firestore in background (non-blocking) - works for all users
function syncProductsFromFirestore() {
    if (!window.db) {
        console.log('ℹ Firestore not available for background sync');
        return;
    }
    
    console.log('🔄 Starting background Firestore sync for products...');
    window.db.collection('products').get()
        .then(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (products.length > 0) {
                // Only update if Firestore has products
                inventory = products;
                localStorage.setItem('africhic-products', JSON.stringify(products));
                console.log('✓ Synced', products.length, 'products from Firestore');
                
                // Trigger UI refresh if on shop page
                if (typeof displayProducts === 'function') {
                    displayProducts();
                }
            }
        })
        .catch(error => {
            console.log('ℹ Background Firestore sync failed (not critical):', error.message);
            console.log('ℹ Using cached or default products instead');
        });
}

// Listen for real-time product updates from admin panel
if (typeof window !== 'undefined') {
    // Try to establish Firestore listener immediately when db becomes available
    let firebaseCheckInterval = setInterval(() => {
        if (window.db && !window.productsRealtimeListenerActive) {
            clearInterval(firebaseCheckInterval);
            console.log('🔄 Establishing Firestore real-time listener for products...');
            window.productsRealtimeListenerActive = true;
            
            window.db.collection('products').onSnapshot(
                (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    if (products.length > 0) {
                        inventory = products;
                        localStorage.setItem('africhic-products', JSON.stringify(products));
                        console.log('✓ Real-time products sync from Firestore:', products.length);
                        
                        // Trigger display update if function exists
                        if (typeof displayProducts === 'function') {
                            displayProducts();
                        }
                    }
                },
                (error) => {
                    console.log('ℹ Products listener ready (waiting for data):', error.message);
                }
            );
        }
    }, 500);
    
    window.addEventListener('productsUpdated', function(e) {
        if (e.detail && e.detail.products) {
            inventory = e.detail.products;
            console.log('✓ Products updated in real-time from admin panel');
            // Trigger UI refresh if on shop page
            if (typeof displayProducts === 'function') {
                displayProducts();
            }
        }
    });

    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', function(e) {
        if (e.key === 'africhic-products' && e.newValue) {
            try {
                inventory = JSON.parse(e.newValue);
                console.log('✓ Products synced from other tab/window');
                if (typeof displayProducts === 'function') {
                    displayProducts();
                }
            } catch (error) {
                console.error('Error syncing products:', error);
            }
        }
    });

    // Set up real-time Firestore listener when available
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            // Try using window.db directly
            if (window.db) {
                console.log('🔄 Establishing real-time listener on window.db for products...');
                window.db.collection('products').onSnapshot(
                    (snapshot) => {
                        const products = [];
                        snapshot.forEach(doc => {
                            products.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        if (products.length > 0) {
                            inventory = products;
                            localStorage.setItem('africhic-products', JSON.stringify(products));
                            console.log('✓ Real-time update from Firestore - Products:', inventory.length);
                            
                            // Refresh product display if on shop page
                            if (typeof displayProducts === 'function') {
                                displayProducts();
                            }
                        }
                    },
                    (error) => {
                        console.error('Real-time listener error:', error.message);
                    }
                );
                console.log('✓ Firestore real-time listener established for products');
            } else if (window.firestoreSync && window.firestoreSync.initialized) {
                // Fallback to firestoreSync
                firestoreSync.listenToProducts((products) => {
                    inventory = products;
                    localStorage.setItem('africhic-products', JSON.stringify(products));
                    console.log('✓ Real-time update from Firestore - Products:', inventory.length);
                    
                    // Refresh product display if on shop page
                    if (typeof displayProducts === 'function') {
                        displayProducts();
                    }
                });
                console.log('✓ Firestore real-time listener established (via firestoreSync)');
            }
        }, 1000); // Wait 1s for Firestore to initialize
    });
}