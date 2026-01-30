// Product Sync Manager
// Ensures product updates are instantly synchronized across all stores and devices
// Handles add, edit, delete operations with real-time propagation
// Works for both guests and logged-in users

class ProductSyncManager {
    constructor() {
        this.listeners = [];
        this.isInitialized = false;
        this.db = null;
        this.syncChannel = null;
        this.firestoreUnsubscribe = null;
        this.lastSyncTime = localStorage.getItem('lastProductSyncTime') || null;
        this.syncRetryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000;
        
        this.init();
    }

    async init() {
        console.log('🔄 ProductSyncManager initializing...');
        
        // Wait for Firebase to be ready
        const firebaseReady = await this.waitForFirebase();
        
        if (!window.db) {
            console.warn('⚠️ Firebase not available, falling back to localStorage sync');
            this.initializeLocalStorageSync();
        } else {
            this.db = window.db;
            this.initializeFirestoreSync();
        }
        
        // Always initialize localStorage sync as fallback
        this.initializeLocalStorageSync();
        
        // Initialize BroadcastChannel for same-domain cross-tab communication
        this.initializeBroadcastChannel();
        
        // Start periodic sync check
        this.startPeriodicSync();
        
        this.isInitialized = true;
        console.log('✓ ProductSyncManager initialized (Firebase ready: ' + (firebaseReady ? 'Yes' : 'No') + ')');
    }

    async waitForFirebase(timeout = 10000) {
        const startTime = Date.now();
        while (!window.db && (Date.now() - startTime) < timeout) {
            await new Promise(r => setTimeout(r, 100));
        }
        
        if (window.db) {
            console.log('✓ Firebase ready for product syncing');
        } else {
            console.log('⏱️ Firebase initialization timeout - will use cache');
        }
        return window.db ? true : false;
    }

    // Start periodic sync to ensure products stay fresh
    startPeriodicSync() {
        setInterval(() => {
            this.forceSync();
        }, 30000); // Sync every 30 seconds
        console.log('✓ Periodic sync started (every 30 seconds)');
    }

    // Force a complete sync from Firestore
    async forceSync() {
        if (!this.db) return;
        
        try {
            const snapshot = await this.db.collection('products').get();
            const products = [];
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (products.length > 0) {
                localStorage.setItem('africhic-products', JSON.stringify(products));
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastProductSyncTime', this.lastSyncTime);
                this.notifyListeners(products);
                console.log('✓ Periodic sync complete:', products.length, 'products');
            }
        } catch (error) {
            console.error('Periodic sync failed:', error.message);
        }
    }

    // Initialize Firestore real-time listener for products
    // Works for guests (no auth required - public read access)
    initializeFirestoreSync() {
        if (!this.db) return;

        try {
            console.log('📡 Setting up Firestore real-time listener for ALL users (guests + logged-in)...');
            
            // Real-time listener - works for all users with internet access
            this.firestoreUnsubscribe = this.db.collection('products')
                .orderBy('updatedAt', 'desc')
                .onSnapshot(
                    (snapshot) => {
                        const products = [];
                        snapshot.forEach(doc => {
                            products.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        console.log('🔄 Real-time product update from Firestore:', products.length, 'products');
                        
                        // Update localStorage (works for offline access)
                        localStorage.setItem('africhic-products', JSON.stringify(products));
                        this.lastSyncTime = new Date().toISOString();
                        localStorage.setItem('lastProductSyncTime', this.lastSyncTime);
                        
                        // Notify all listeners (for all pages)
                        this.notifyListeners(products);
                        
                        // Broadcast to other tabs (for multi-tab support)
                        this.broadcastToTabs({
                            type: 'PRODUCTS_UPDATED',
                            products: products,
                            timestamp: Date.now(),
                            totalProducts: products.length
                        });
                        
                        // Dispatch global event
                        window.dispatchEvent(new CustomEvent('productsSync', {
                            detail: { products, count: products.length }
                        }));
                    },
                    (error) => {
                        console.error('❌ Firestore listener error:', error.message);
                        this.syncRetryCount++;
                        
                        if (this.syncRetryCount < this.maxRetries) {
                            console.log(`⏳ Retrying Firestore connection (attempt ${this.syncRetryCount}/${this.maxRetries})...`);
                            setTimeout(() => {
                                this.initializeFirestoreSync();
                            }, this.retryDelay);
                        } else {
                            console.log('⚠️ Firestore connection failed after retries, using localStorage');
                        }
                    }
                );
            
            this.syncRetryCount = 0; // Reset on successful connection
            console.log('✓ Real-time Firestore listener ready for ALL users');
        } catch (error) {
            console.error('Error initializing Firestore listener:', error);
        }
    }

    // Initialize localStorage sync for offline support
    initializeLocalStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'africhic-products' && e.newValue) {
                try {
                    const products = JSON.parse(e.newValue);
                    console.log('🔄 Product update detected from localStorage:', products.length, 'products');
                    
                    // Notify all listeners (products updated in another tab)
                    this.notifyListeners(products);
                } catch (error) {
                    console.error('Error parsing localStorage products:', error);
                }
            }
        });
    }

    // Initialize BroadcastChannel for instant cross-tab sync
    initializeBroadcastChannel() {
        if (!('BroadcastChannel' in window)) {
            console.log('ℹ️ BroadcastChannel not available');
            return;
        }

        try {
            this.syncChannel = new BroadcastChannel('africhic-product-sync');
            
            this.syncChannel.onmessage = (event) => {
                if (event.data.type === 'PRODUCTS_UPDATED') {
                    console.log('🔄 Product update from another tab via BroadcastChannel');
                    this.notifyListeners(event.data.products);
                }
            };
            
            console.log('✓ BroadcastChannel initialized for product sync');
        } catch (error) {
            console.log('BroadcastChannel initialization failed:', error.message);
        }
    }

    // Broadcast message to other tabs via BroadcastChannel
    broadcastToTabs(message) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage(message);
            } catch (error) {
                console.error('Error broadcasting to tabs:', error);
            }
        }
    }

    // Register a listener for product updates
    onProductsUpdated(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
            console.log('✓ Product update listener registered, total listeners:', this.listeners.length);
        }
    }

    // Notify all registered listeners
    notifyListeners(products) {
        this.listeners.forEach((callback, index) => {
            try {
                callback(products);
            } catch (error) {
                console.error(`Error in listener #${index}:`, error);
            }
        });
    }

    // Save products to both localStorage and Firestore
    async saveProducts(products) {
        try {
            // Save to localStorage immediately
            localStorage.setItem('africhic-products', JSON.stringify(products));
            console.log('✓ Products saved to localStorage:', products.length, 'items');
            
            // Notify local listeners
            this.notifyListeners(products);
            
            // Broadcast to other tabs
            this.broadcastToTabs({
                type: 'PRODUCTS_UPDATED',
                products: products,
                timestamp: Date.now()
            });

            // Save to Firestore in background (non-blocking)
            if (this.db) {
                this.syncToFirestore(products);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving products:', error);
            return false;
        }
    }

    // Sync products to Firestore
    async syncToFirestore(products) {
        if (!this.db) return;

        try {
            const batch = this.db.batch();
            
            // Get all existing product documents
            const existingSnapshot = await this.db.collection('products').get();
            const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
            
            // Add/update new products
            products.forEach(product => {
                const docRef = this.db.collection('products').doc(product.id);
                batch.set(docRef, {
                    ...product,
                    syncedAt: new Date().toISOString()
                });
                existingIds.delete(product.id);
            });
            
            // Delete products that are no longer in the list
            existingIds.forEach(id => {
                const docRef = this.db.collection('products').doc(id);
                batch.delete(docRef);
            });
            
            await batch.commit();
            console.log('✓ Products synced to Firestore:', products.length, 'items');
        } catch (error) {
            console.error('⚠️ Firestore sync failed (using localStorage fallback):', error.message);
        }
    }

    // Add a new product
    async addProduct(product) {
        try {
            // Load current products
            const storedProducts = localStorage.getItem('africhic-products');
            const products = storedProducts ? JSON.parse(storedProducts) : [];
            
            // Add new product with timestamp
            const newProduct = {
                ...product,
                id: product.id || ('PROD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            products.push(newProduct);
            
            // Save and sync
            await this.saveProducts(products);
            
            console.log('✓ Product added:', newProduct.id);
            return newProduct;
        } catch (error) {
            console.error('❌ Error adding product:', error);
            throw error;
        }
    }

    // Update an existing product
    async updateProduct(productId, updates) {
        try {
            // Load current products
            const storedProducts = localStorage.getItem('africhic-products');
            const products = storedProducts ? JSON.parse(storedProducts) : [];
            
            // Find and update product
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                throw new Error(`Product ${productId} not found`);
            }
            
            products[productIndex] = {
                ...products[productIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Save and sync
            await this.saveProducts(products);
            
            console.log('✓ Product updated:', productId);
            return products[productIndex];
        } catch (error) {
            console.error('❌ Error updating product:', error);
            throw error;
        }
    }

    // Delete a product
    async deleteProduct(productId) {
        try {
            // Load current products
            const storedProducts = localStorage.getItem('africhic-products');
            const products = storedProducts ? JSON.parse(storedProducts) : [];
            
            // Filter out the product
            const filtered = products.filter(p => p.id !== productId);
            
            if (filtered.length === products.length) {
                throw new Error(`Product ${productId} not found`);
            }
            
            // Save and sync
            await this.saveProducts(filtered);
            
            console.log('✓ Product deleted:', productId);
            return true;
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            throw error;
        }
    }

    // Cleanup
    destroy() {
        if (this.firestoreUnsubscribe) {
            this.firestoreUnsubscribe();
        }
        if (this.syncChannel) {
            this.syncChannel.close();
        }
        this.listeners = [];
        console.log('✓ ProductSyncManager destroyed');
    }

    // Get all products (for guests and logged-in users)
    getAllProducts() {
        const cached = localStorage.getItem('africhic-products');
        return cached ? JSON.parse(cached) : [];
    }

    // Get products by category
    getProductsByCategory(category) {
        const all = this.getAllProducts();
        if (category === 'all') return all;
        return all.filter(p => p.category === category);
    }

    // Get single product
    getProduct(productId) {
        const all = this.getAllProducts();
        return all.find(p => p.id === productId) || null;
    }

    // Get all categories from products
    getCategories() {
        const all = this.getAllProducts();
        const categories = new Set();
        all.forEach(p => {
            if (p.category) categories.add(p.category);
        });
        return Array.from(categories);
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: navigator.onLine,
            lastSync: this.lastSyncTime,
            totalProducts: this.getAllProducts().length,
            categories: this.getCategories().length
        };
    }
}

// Initialize global instance
window.productSyncManager = window.productSyncManager || new ProductSyncManager();
