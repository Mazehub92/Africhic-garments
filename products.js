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

// Initialize products on script load (before DOM ready)
console.log('📦 Products.js initializing...');

// Immediately set up real-time listener for ALL pages
function setupProductRealTimeListener() {
    // Wait for Firebase
    let checkCount = 0;
    const setupInterval = setInterval(() => {
        checkCount++;
        if (window.db || checkCount > 30) { // 30 checks = 15 seconds max
            clearInterval(setupInterval);
            
            if (!window.db) {
                console.log('⚠ Firebase not available, will use cached products');
                return;
            }
            
            console.log('🔄 Setting up real-time products listener (immediate)...');
            window.productsRealtimeListenerActive = true;
            
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
                    
                    if (products.length > 0) {
                        inventory = products;
                        localStorage.setItem('africhic-products', JSON.stringify(products));
                        console.log('✓ Products synced (real-time):', products.length, 'items');
                        
                        // Trigger UI refresh if available
                        if (typeof displayProducts === 'function') {
                            displayProducts();
                        }
                        // Also dispatch custom event for other listeners
                        window.dispatchEvent(new CustomEvent('productsLoaded', {
                            detail: { products: products }
                        }));
                    }
                },
                (error) => {
                    console.log('ℹ Real-time listener ready (error):', error.message);
                }
            );
        }
    }, 500);
}

// Load products from Firestore (synced across devices)
async function loadInventoryFromFirebase() {
    try {
        console.log('🔄 Loading products for display...');
        
        // FIRST: Try Firestore immediately (works for all users, no auth needed)
        if (window.db) {
            console.log('ℹ Attempting Firestore load (first-time users, guests)...');
            const products = await getProductsFromFirestore();
            if (products && products.length > 0) {
                inventory = products;
                localStorage.setItem('africhic-products', JSON.stringify(products));
                console.log('✓ Loaded from Firestore:', inventory.length, 'products');
                return;
            }
        }
        
        // SECOND: Fall back to localStorage (returning users, offline access)
        const storedProducts = localStorage.getItem('africhic-products');
        if (storedProducts) {
            try {
                inventory = JSON.parse(storedProducts);
                console.log('✓ Loaded from localStorage:', inventory.length, 'products');
                
                // Still try Firestore sync in background
                if (window.db) {
                    syncProductsFromFirestore();
                }
                return;
            } catch (e) {
                console.error('Error parsing stored products:', e);
            }
        }

        // THIRD: Empty inventory (admin hasn't added products yet)
        console.log('⚠ No products available yet - waiting for admin to add');
        inventory = [];
        localStorage.setItem('africhic-products', JSON.stringify([]));

    } catch (error) {
        console.error("Error loading products:", error);
        inventory = [];
        localStorage.setItem('africhic-products', JSON.stringify([]));
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