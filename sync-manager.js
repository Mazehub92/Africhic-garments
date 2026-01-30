// Global Sync Manager
// Ensures all data stays synchronized across all devices, browsers, and tabs

class SyncManager {
    constructor() {
        this.syncInterval = null;
        this.offlineQueue = [];
        this.listeners = {};
        this.lastSyncTime = null;
        this.isOnline = navigator.onLine;
        this.deviceId = this.generateDeviceId();
        this.syncVersion = 0;
        
        console.log('🔄 SyncManager initialized with device ID:', this.deviceId);
        
        this.initializeOfflineDetection();
        this.initializeCrossTabCommunication();
        this.initializeSyncListeners();
        this.startPeriodicSync();
    }

    // Generate unique device ID
    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // Detect online/offline status
    initializeOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Online - Processing offline queue');
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Offline mode activated');
        });
    }

    // Cross-tab communication
    initializeCrossTabCommunication() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('sync-')) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.deviceId !== this.deviceId) {
                        console.log('📡 Sync message from another tab:', data.type);
                        this.handleSyncMessage(data);
                    }
                } catch (err) {
                    console.error('Error parsing sync message:', err);
                }
            }
        });

        // Listen for BroadcastChannel (for modern browsers)
        if ('BroadcastChannel' in window) {
            try {
                this.broadcastChannel = new BroadcastChannel('africhic-sync');
                this.broadcastChannel.onmessage = (event) => {
                    if (event.data.deviceId !== this.deviceId) {
                        console.log('📡 BroadcastChannel message:', event.data.type);
                        this.handleSyncMessage(event.data);
                    }
                };
                console.log('✓ BroadcastChannel enabled for real-time cross-tab sync');
            } catch (err) {
                console.log('BroadcastChannel not available, using storage events');
            }
        }
    }

    // Initialize real-time Firestore listeners
    initializeSyncListeners() {
        if (!window.db) {
            console.log('Firebase not ready, will retry');
            setTimeout(() => this.initializeSyncListeners(), 1000);
            return;
        }

        // Real-time products listener
        this.listenToProducts();
        // Real-time orders listener
        this.listenToOrders();
        // Real-time cart listener
        this.listenToCart();
    }

    // Listen to products collection
    listenToProducts() {
        if (!window.db) return;

        try {
            this.productsUnsubscribe = window.db.collection('products').onSnapshot(
                (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({id: doc.id, ...doc.data()});
                    });
                    
                    // Update localStorage
                    localStorage.setItem('africhic-products', JSON.stringify(products));
                    localStorage.setItem('africhic-products-updated', Date.now().toString());
                    
                    // Notify listeners
                    this.notifyListeners('products', products);
                    
                    // Broadcast to other tabs
                    this.broadcastSync({
                        type: 'products',
                        data: products,
                        timestamp: Date.now(),
                        deviceId: this.deviceId
                    });
                    
                    console.log('✓ Products synced from Firestore:', products.length, 'items');
                },
                (error) => {
                    console.error('Products listener error:', error.message);
                }
            );
        } catch (err) {
            console.error('Failed to set products listener:', err);
        }
    }

    // Listen to orders collection
    listenToOrders() {
        if (!window.db) return;

        try {
            this.ordersUnsubscribe = window.db.collection('orders').onSnapshot(
                (snapshot) => {
                    const orders = [];
                    snapshot.forEach(doc => {
                        orders.push({id: doc.id, ...doc.data()});
                    });
                    
                    // Update localStorage
                    localStorage.setItem('africhic-orders', JSON.stringify(orders));
                    localStorage.setItem('africhic-orders-updated', Date.now().toString());
                    
                    // Notify listeners
                    this.notifyListeners('orders', orders);
                    
                    // Broadcast to other tabs
                    this.broadcastSync({
                        type: 'orders',
                        data: orders,
                        timestamp: Date.now(),
                        deviceId: this.deviceId
                    });
                    
                    console.log('✓ Orders synced from Firestore:', orders.length, 'items');
                },
                (error) => {
                    console.error('Orders listener error:', error.message);
                }
            );
        } catch (err) {
            console.error('Failed to set orders listener:', err);
        }
    }

    // Listen to cart items
    listenToCart() {
        if (!window.db) return;

        try {
            this.cartUnsubscribe = window.db.collection('cart').onSnapshot(
                (snapshot) => {
                    const cartItems = [];
                    snapshot.forEach(doc => {
                        cartItems.push({id: doc.id, ...doc.data()});
                    });
                    
                    // Preserve local cart if Firestore cart is empty and local cart has items
                    // This prevents losing cart items when logging in with an empty Firestore cart
                    const existingCart = JSON.parse(localStorage.getItem('africhic-cart')) || [];
                    const cartToUse = cartItems.length > 0 ? cartItems : existingCart;
                    
                    // Only update if there's actual data or if local cart is empty
                    if (cartItems.length > 0 || existingCart.length === 0) {
                        localStorage.setItem('africhic-cart', JSON.stringify(cartToUse));
                        localStorage.setItem('africhic-cart-updated', Date.now().toString());
                        
                        // Notify listeners
                        this.notifyListeners('cart', cartToUse);
                        
                        // Broadcast to other tabs
                        this.broadcastSync({
                            type: 'cart',
                            data: cartToUse,
                            timestamp: Date.now(),
                            deviceId: this.deviceId
                        });
                        
                        console.log('✓ Cart synced from Firestore:', cartToUse.length, 'items');
                    } else {
                        console.log('ℹ Firestore cart empty - preserving local cart with', existingCart.length, 'items');
                    }
                },
                (error) => {
                    console.error('Cart listener error:', error.message);
                }
            );
        } catch (err) {
            console.error('Failed to set cart listener:', err);
        }
    }

    // Handle sync messages from other tabs
    handleSyncMessage(data) {
        const {type, data: syncData, timestamp} = data;
        
        // Update local storage
        const key = `africhic-${type}`;
        localStorage.setItem(key, JSON.stringify(syncData));
        localStorage.setItem(`${key}-updated`, Date.now().toString());
        
        // Notify listeners
        this.notifyListeners(type, syncData);
        
        console.log(`✓ ${type} synchronized from another tab (${syncData.length || 1} items)`);
    }

    // Broadcast sync data to other tabs
    broadcastSync(data) {
        // Using BroadcastChannel if available (faster)
        if (this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage(data);
            } catch (err) {
                console.error('BroadcastChannel error:', err);
            }
        }

        // Fallback to localStorage
        try {
            const key = 'sync-' + data.type + '-' + Date.now();
            localStorage.setItem(key, JSON.stringify(data));
            // Clean up old sync messages
            this.cleanupOldSyncMessages();
        } catch (err) {
            console.error('Storage event broadcast error:', err);
        }
    }

    // Clean up old sync messages from localStorage
    cleanupOldSyncMessages() {
        const now = Date.now();
        const maxAge = 60000; // 1 minute
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sync-')) {
                try {
                    const item = localStorage.getItem(key);
                    const data = JSON.parse(item);
                    if (now - data.timestamp > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch (err) {
                    // Invalid sync message, remove it
                    localStorage.removeItem(key);
                }
            }
        }
    }

    // Register listener for data changes
    on(type, callback) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
        
        // Immediately call with current data if available
        const key = `africhic-${type}`;
        const currentData = localStorage.getItem(key);
        if (currentData) {
            try {
                callback(JSON.parse(currentData));
            } catch (err) {
                console.error('Error calling listener:', err);
            }
        }
        
        return () => {
            this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        };
    }

    // Notify all listeners
    notifyListeners(type, data) {
        if (this.listeners[type]) {
            this.listeners[type].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error('Error in listener callback:', err);
                }
            });
        }
        
        // Also dispatch custom event
        window.dispatchEvent(new CustomEvent(`africhic-${type}-updated`, {
            detail: {data, timestamp: Date.now()}
        }));
    }

    // Add operation to offline queue
    queueOperation(operation) {
        this.offlineQueue.push({
            ...operation,
            timestamp: Date.now(),
            deviceId: this.deviceId,
            id: 'op-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        });
        
        // Save queue to localStorage
        localStorage.setItem('sync-queue', JSON.stringify(this.offlineQueue));
        console.log('📦 Operation queued:', operation.type, '(total:', this.offlineQueue.length, ')');
    }

    // Process offline queue when back online
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log('Processing', this.offlineQueue.length, 'queued operations...');
        const queue = [...this.offlineQueue];
        
        for (const operation of queue) {
            try {
                await this.processQueuedOperation(operation);
                
                // Remove from queue
                this.offlineQueue = this.offlineQueue.filter(op => op.id !== operation.id);
                localStorage.setItem('sync-queue', JSON.stringify(this.offlineQueue));
                
                console.log('✓ Processed queued operation:', operation.type);
            } catch (err) {
                console.error('Error processing queued operation:', err);
            }
        }
        
        console.log('✓ Offline queue processed');
    }

    // Process a single queued operation
    async processQueuedOperation(operation) {
        const {type, collectionName, action, data} = operation;
        
        if (!window.db) throw new Error('Firebase not available');

        switch (action) {
            case 'set':
                await window.db.collection(collectionName).doc(data.id).set(data);
                break;
            case 'update':
                await window.db.collection(collectionName).doc(data.id).update(data);
                break;
            case 'delete':
                await window.db.collection(collectionName).doc(data.id).delete();
                break;
            case 'batch':
                const batch = window.db.batch();
                data.forEach(item => {
                    const docRef = window.db.collection(collectionName).doc(item.id);
                    if (item.deleted) {
                        batch.delete(docRef);
                    } else {
                        batch.set(docRef, item);
                    }
                });
                await batch.commit();
                break;
        }
    }

    // Periodic sync to ensure data consistency
    startPeriodicSync() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.performFullSync();
            }
        }, 30000); // Every 30 seconds
    }

    // Perform full sync
    async performFullSync() {
        try {
            if (!window.db) return;

            const timestamp = Date.now();
            
            // Sync products
            const productsSnapshot = await window.db.collection('products').get();
            const products = [];
            productsSnapshot.forEach(doc => {
                products.push({id: doc.id, ...doc.data()});
            });
            localStorage.setItem('africhic-products', JSON.stringify(products));
            
            // Sync orders
            const ordersSnapshot = await window.db.collection('orders').get();
            const orders = [];
            ordersSnapshot.forEach(doc => {
                orders.push({id: doc.id, ...doc.data()});
            });
            localStorage.setItem('africhic-orders', JSON.stringify(orders));
            
            this.lastSyncTime = timestamp;
            console.log('✓ Full sync completed at', new Date(timestamp).toLocaleTimeString());
        } catch (err) {
            console.error('Full sync error:', err);
        }
    }

    // Get current sync status
    getStatus() {
        return {
            isOnline: this.isOnline,
            deviceId: this.deviceId,
            offlineQueueLength: this.offlineQueue.length,
            lastSyncTime: this.lastSyncTime,
            hasBroadcastChannel: !!this.broadcastChannel
        };
    }

    // Clean up listeners
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (this.productsUnsubscribe) this.productsUnsubscribe();
        if (this.ordersUnsubscribe) this.ordersUnsubscribe();
        if (this.cartUnsubscribe) this.cartUnsubscribe();
        if (this.broadcastChannel) this.broadcastChannel.close();
        
        console.log('SyncManager destroyed');
    }
}

// Initialize global SyncManager
window.syncManager = new SyncManager();

// Expose sync methods to window for easy access
window.syncData = {
    // Save a document and ensure cross-device sync
    async saveDocument(collectionName, docId, data) {
        if (!window.db) {
            window.syncManager.queueOperation({
                type: 'save',
                collectionName,
                action: 'set',
                data: {...data, id: docId}
            });
            return;
        }

        try {
            await window.db.collection(collectionName).doc(docId).set(data);
            console.log('✓ Document saved:', collectionName, docId);
        } catch (err) {
            console.error('Error saving document:', err);
            window.syncManager.queueOperation({
                type: 'save',
                collectionName,
                action: 'set',
                data: {...data, id: docId}
            });
        }
    },

    // Update a document and ensure cross-device sync
    async updateDocument(collectionName, docId, updates) {
        if (!window.db) {
            window.syncManager.queueOperation({
                type: 'update',
                collectionName,
                action: 'update',
                data: {...updates, id: docId}
            });
            return;
        }

        try {
            await window.db.collection(collectionName).doc(docId).update(updates);
            console.log('✓ Document updated:', collectionName, docId);
        } catch (err) {
            console.error('Error updating document:', err);
            window.syncManager.queueOperation({
                type: 'update',
                collectionName,
                action: 'update',
                data: {...updates, id: docId}
            });
        }
    },

    // Delete a document and ensure cross-device sync
    async deleteDocument(collectionName, docId) {
        if (!window.db) {
            window.syncManager.queueOperation({
                type: 'delete',
                collectionName,
                action: 'delete',
                data: {id: docId}
            });
            return;
        }

        try {
            await window.db.collection(collectionName).doc(docId).delete();
            console.log('✓ Document deleted:', collectionName, docId);
        } catch (err) {
            console.error('Error deleting document:', err);
            window.syncManager.queueOperation({
                type: 'delete',
                collectionName,
                action: 'delete',
                data: {id: docId}
            });
        }
    },

    // Batch operations for better performance
    async batchOperations(collectionName, items) {
        if (!window.db) {
            window.syncManager.queueOperation({
                type: 'batch',
                collectionName,
                action: 'batch',
                data: items
            });
            return;
        }

        try {
            const batch = window.db.batch();
            items.forEach(item => {
                const docRef = window.db.collection(collectionName).doc(item.id);
                if (item.deleted) {
                    batch.delete(docRef);
                } else {
                    batch.set(docRef, item);
                }
            });
            await batch.commit();
            console.log('✓ Batch operation completed:', collectionName, items.length, 'items');
        } catch (err) {
            console.error('Error in batch operation:', err);
            window.syncManager.queueOperation({
                type: 'batch',
                collectionName,
                action: 'batch',
                data: items
            });
        }
    }
};

// Load offline queue on startup
window.addEventListener('DOMContentLoaded', () => {
    try {
        const savedQueue = localStorage.getItem('sync-queue');
        if (savedQueue) {
            window.syncManager.offlineQueue = JSON.parse(savedQueue);
            console.log('📦 Loaded', window.syncManager.offlineQueue.length, 'operations from offline queue');
            
            // Process queue if online
            if (navigator.onLine) {
                window.syncManager.processOfflineQueue();
            }
        }
    } catch (err) {
        console.error('Error loading offline queue:', err);
    }
});

console.log('✓ SyncManager loaded - Ready for multi-device synchronization');
