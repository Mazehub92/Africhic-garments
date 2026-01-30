// Firestore Sync Module
// Handles all cloud data synchronization across devices

class FirestoreSync {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    // Initialize Firestore connection with proper waiting
    async init() {
        return new Promise(async (resolve) => {
            // First, ensure Firebase is ready
            const isReady = await ensureFirebaseReady(10000);
            
            if (!isReady || !window.db) {
                console.warn('✗ Firestore not available, using localStorage fallback');
                this.initialized = false;
                resolve(false);
                return;
            }
            
            this.db = window.db;
            this.initialized = true;
            console.log('✓ Firestore Sync initialized');
            
            // Start real-time listeners once initialized
            this.setupRealTimeListeners();
            resolve(true);
        });
    }
    
    // Setup real-time listeners for cross-device sync
    setupRealTimeListeners() {
        if (!this.db) return;
        
        console.log('🔄 Setting up real-time listeners for cross-device sync');
        
        // Listen to products in real-time
        this.productListener = this.db.collection('products')
            .onSnapshot(
                (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log('🔄 Products synced across devices:', products.length);
                    // Save to localStorage for fallback
                    localStorage.setItem('africhic-products', JSON.stringify(products));
                },
                (error) => {
                    console.error('Error in real-time products listener:', error);
                }
            );
        
        // Listen to orders in real-time
        this.orderListener = this.db.collection('orders')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const orders = [];
                    snapshot.forEach(doc => {
                        orders.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log('🔄 Orders synced across devices:', orders.length);
                    // Save to localStorage for fallback
                    localStorage.setItem('africhic-orders', JSON.stringify(orders));
                },
                (error) => {
                    console.error('Error in real-time orders listener:', error);
                }
            );
    }

    // ============ PRODUCTS ============

    // Save/update products to Firestore using window.db directly
    async saveProducts(products) {
        // Try using window.db directly first (faster)
        if (window.db) {
            try {
                const batch = window.db.batch();
                
                // Clear existing products
                const snapshot = await window.db.collection('products').get();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                
                // Add new products
                products.forEach(product => {
                    const docRef = window.db.collection('products').doc(product.id);
                    batch.set(docRef, product);
                });
                
                await batch.commit();
                console.log('✓ Products synced to Firestore');
                return true;
            } catch (error) {
                console.error('Error saving products:', error);
                return false;
            }
        }
        
        // Fallback to instance db
        if (!this.db) return false;
        
        try {
            const batch = this.db.batch();
            
            // Clear existing products
            const snapshot = await this.db.collection('products').get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            
            // Add new products
            products.forEach(product => {
                const docRef = this.db.collection('products').doc(product.id);
                batch.set(docRef, product);
            });
            
            await batch.commit();
            console.log('✓ Products synced to Firestore');
            return true;
        } catch (error) {
            console.error('Error saving products:', error);
            return false;
        }
    }

    // Get all products from Firestore
    async getProducts() {
        // Try using window.db directly first (faster)
        if (window.db) {
            try {
                const snapshot = await window.db.collection('products').get();
                const products = [];
                snapshot.forEach(doc => {
                    products.push(doc.data());
                });
                console.log(`✓ Retrieved ${products.length} products from Firestore`);
                return products;
            } catch (error) {
                console.error('Error getting products from window.db:', error);
                // Continue to instance db
            }
        }
        
        // Fallback to instance db
        if (!this.db) return null;
        
        try {
            const snapshot = await this.db.collection('products').get();
            const products = [];
            snapshot.forEach(doc => {
                products.push(doc.data());
            });
            console.log(`✓ Retrieved ${products.length} products from Firestore`);
            return products;
        } catch (error) {
            console.error('Error getting products:', error);
            return null;
        }
    }

    // Listen for real-time product updates
    listenToProducts(callback) {
        // Try using window.db directly first
        const db = window.db || this.db;
        if (!db) return null;
        
        return db.collection('products').onSnapshot(
            (snapshot) => {
                const products = [];
                snapshot.forEach(doc => {
                    products.push(doc.data());
                });
                console.log('🔄 Real-time product update received from Firestore');
                callback(products);
            },
            (error) => {
                console.error('Error listening to products:', error);
            }
        );
    }

    // Update product stock
    async updateProductStock(productId, newStock) {
        if (!this.db) return false;
        
        try {
            await this.db.collection('products').doc(productId).update({
                stock: newStock
            });
            console.log(`✓ Stock updated for product ${productId}`);
            return true;
        } catch (error) {
            console.error('Error updating stock:', error);
            return false;
        }
    }

    // ============ ORDERS ============

    // Save order to Firestore
    async saveOrder(order) {
        if (!this.db) return false;
        
        try {
            await this.db.collection('orders').doc(order.id).set(order);
            console.log('✓ Order saved to Firestore:', order.id);
            return true;
        } catch (error) {
            console.error('Error saving order:', error);
            return false;
        }
    }

    // Get all orders from Firestore
    async getOrders() {
        if (!this.db) return null;
        
        try {
            const snapshot = await this.db.collection('orders').get();
            const orders = [];
            snapshot.forEach(doc => {
                orders.push(doc.data());
            });
            console.log(`✓ Retrieved ${orders.length} orders from Firestore`);
            return orders;
        } catch (error) {
            console.error('Error getting orders:', error);
            return null;
        }
    }

    // Get orders by customer email
    async getOrdersByCustomer(email) {
        if (!this.db) return null;
        
        try {
            const snapshot = await this.db.collection('orders')
                .where('customer_email', '==', email)
                .get();
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push(doc.data());
            });
            return orders;
        } catch (error) {
            console.error('Error getting customer orders:', error);
            return null;
        }
    }

    // Update order status
    async updateOrderStatus(orderId, status) {
        if (!this.db) return false;
        
        try {
            await this.db.collection('orders').doc(orderId).update({
                status: status,
                updatedAt: new Date()
            });
            console.log(`✓ Order ${orderId} status updated to ${status}`);
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    }

    // Update order with tracking info
    async updateOrderTracking(orderId, trackingInfo) {
        if (!this.db) return false;
        
        try {
            await this.db.collection('orders').doc(orderId).update({
                tracking_info: trackingInfo,
                updatedAt: new Date()
            });
            console.log(`✓ Tracking info added to order ${orderId}`);
            return true;
        } catch (error) {
            console.error('Error updating tracking:', error);
            return false;
        }
    }

    // Update order with collection info
    async updateOrderCollection(orderId, collectionInfo) {
        if (!this.db) return false;
        
        try {
            await this.db.collection('orders').doc(orderId).update({
                collection_info: collectionInfo,
                updatedAt: new Date()
            });
            console.log(`✓ Collection info added to order ${orderId}`);
            return true;
        } catch (error) {
            console.error('Error updating collection info:', error);
            return false;
        }
    }

    // Listen for real-time order updates
    listenToOrders(callback) {
        if (!this.db) return null;
        
        return this.db.collection('orders')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const orders = [];
                    snapshot.forEach(doc => {
                        orders.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log('🔄 Real-time order update received:', orders.length, 'orders');
                    callback(orders);
                },
                (error) => {
                    console.error('Error listening to orders:', error);
                }
            );
    }

    // Listen for customer's orders
    listenToCustomerOrders(email, callback) {
        if (!this.db) return null;
        
        return this.db.collection('orders')
            .where('customer_email', '==', email)
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const orders = [];
                    snapshot.forEach(doc => {
                        orders.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log('🔄 Customer orders updated:', orders.length, 'orders');
                    callback(orders);
                },
                (error) => {
                    console.error('Error listening to customer orders:', error);
                }
            );
    }

    // ============ UTILITY FUNCTIONS ============

    // Sync localStorage to Firestore
    async syncLocalStorageToFirestore() {
        console.log('Syncing localStorage to Firestore...');
        
        // Sync products
        const products = JSON.parse(localStorage.getItem('africhic-products')) || [];
        if (products.length > 0) {
            await this.saveProducts(products);
        }
        
        // Sync orders
        const orders = JSON.parse(localStorage.getItem('africhic-orders')) || [];
        if (orders.length > 0) {
            for (let order of orders) {
                await this.saveOrder(order);
            }
        }
        
        console.log('✓ Sync complete');
    }

    // Sync Firestore to localStorage (offline fallback)
    async syncFirestoreToLocalStorage() {
        console.log('Syncing Firestore to localStorage...');
        
        // Sync products
        const products = await this.getProducts();
        if (products) {
            localStorage.setItem('africhic-products', JSON.stringify(products));
        }
        
        // Sync orders
        const orders = await this.getOrders();
        if (orders) {
            localStorage.setItem('africhic-orders', JSON.stringify(orders));
        }
        
        console.log('✓ Sync complete');
    }
}

// Create global instance
const firestoreSync = new FirestoreSync();
window.firestoreSync = firestoreSync;  // Expose globally

// Initialize on page load with proper waiting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            firestoreSync.init().then(success => {
                if (success) {
                    console.log('✓ Firestore real-time sync active');
                    firestoreSync.syncFirestoreToLocalStorage();
                }
            }).catch(err => {
                console.error('Error initializing Firestore sync:', err);
            });
        }, 100);
    });
} else {
    setTimeout(() => {
        firestoreSync.init().then(success => {
            if (success) {
                console.log('✓ Firestore real-time sync active');
                firestoreSync.syncFirestoreToLocalStorage();
            }
        }).catch(err => {
            console.error('Error initializing Firestore sync:', err);
        });
    }, 100);
}

// Listen for online/offline events
window.addEventListener('online', () => {
    console.log('🌐 Back online - syncing data with Firestore...');
    firestoreSync.syncLocalStorageToFirestore().catch(err => {
        console.error('Error syncing to Firestore:', err);
    });
});

window.addEventListener('offline', () => {
    console.log('📴 Offline - using localStorage fallback');
});
