// Order Management System
// Handles order creation, tracking, notifications, and admin dashboard updates

class OrderManager {
    constructor() {
        this.ordersCollection = 'orders';
        this.notificationsCollection = 'admin_notifications';
        this.initialized = false;
        this.initializeOrderSystem();
    }

    initializeOrderSystem() {
        // Wait for Firebase to be ready
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && window.db) {
                clearInterval(checkFirebase);
                this.setupRealtimeListeners();
                this.initialized = true;
                console.log('✓ Order Manager initialized');
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            if (!this.initialized) {
                console.warn('Firebase not ready, using local order storage');
                this.initialized = true;
            }
        }, 5000);
    }

    /**
     * Save a new order to Firestore and trigger admin notification
     */
    async saveOrder(orderData) {
        return new Promise(async (resolve) => {
            const order = {
                ...orderData,
                id: 'ORD-' + Date.now(),
                createdAt: new Date(),
                status: orderData.status || 'pending',
                notified: false
            };

            try {
                // Save to Firestore if available
                if (window.db) {
                    await window.db.collection(this.ordersCollection).doc(order.id).set(order);
                    console.log('✓ Order saved to Firestore:', order.id);
                    
                    // Create admin notification
                    await this.createAdminNotification(order);
                    
                    // Broadcast to all admin tabs
                    this.broadcastOrderUpdate('new_order', order);
                } else {
                    // Fallback to localStorage
                    this.saveOrderLocally(order);
                }
                
                resolve({ success: true, orderId: order.id });
            } catch (error) {
                console.error('Error saving order:', error);
                // Fallback to localStorage
                this.saveOrderLocally(order);
                resolve({ success: true, orderId: order.id });
            }
        });
    }

    /**
     * Save order to localStorage as fallback
     */
    saveOrderLocally(order) {
        let orders = JSON.parse(localStorage.getItem('africhic-orders')) || [];
        orders.push(order);
        localStorage.setItem('africhic-orders', JSON.stringify(orders));
        console.log('✓ Order saved to localStorage:', order.id);
    }

    /**
     * Create admin notification for new order
     */
    async createAdminNotification(order) {
        try {
            if (!window.db) return false;

            const notification = {
                id: 'NOTIF-' + Date.now(),
                orderId: order.id,
                type: 'new_order',
                title: `New Order: ${order.customer_name}`,
                message: `${order.customer_name} has placed an order for R${order.total.toFixed(2)}`,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerPhone: order.customer_phone,
                orderTotal: order.total,
                orderItems: order.items.length,
                createdAt: new Date(),
                read: false,
                action_url: `admin-orders.html?view=${order.id}`
            };

            await window.db.collection(this.notificationsCollection).doc(notification.id).set(notification);
            
            // Update order to mark as notified
            await window.db.collection(this.ordersCollection).doc(order.id).update({
                notified: true,
                notificationId: notification.id
            });

            console.log('✓ Admin notification created:', notification.id);
            return true;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    }

    /**
     * Get all orders from Firestore
     */
    async getAllOrders(limit = 100) {
        try {
            if (!window.db) {
                return this.getOrdersLocally();
            }

            const snapshot = await window.db.collection(this.ordersCollection)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('✓ Loaded', orders.length, 'orders from Firestore');
            return orders;
        } catch (error) {
            console.error('Error loading orders:', error);
            return this.getOrdersLocally();
        }
    }

    /**
     * Get orders from localStorage as fallback
     */
    getOrdersLocally() {
        const orders = JSON.parse(localStorage.getItem('africhic-orders')) || [];
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Get single order by ID
     */
    async getOrderById(orderId) {
        try {
            if (!window.db) {
                const orders = this.getOrdersLocally();
                return orders.find(o => o.id === orderId);
            }

            const doc = await window.db.collection(this.ordersCollection).doc(orderId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error loading order:', error);
            return null;
        }
    }

    /**
     * Update order status
     */
    async updateOrderStatus(orderId, newStatus) {
        try {
            if (window.db) {
                await window.db.collection(this.ordersCollection).doc(orderId).update({
                    status: newStatus,
                    updatedAt: new Date()
                });
                console.log('✓ Order status updated:', orderId, '->', newStatus);
            } else {
                // Update locally
                let orders = this.getOrdersLocally();
                orders = orders.map(o => 
                    o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o
                );
                localStorage.setItem('africhic-orders', JSON.stringify(orders));
            }
            
            // Broadcast update
            this.broadcastOrderUpdate('status_change', { orderId, newStatus });
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    }

    /**
     * Get admin notifications
     */
    async getAdminNotifications(limit = 20) {
        try {
            if (!window.db) return [];

            const snapshot = await window.db.collection(this.notificationsCollection)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return notifications;
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId) {
        try {
            if (window.db) {
                await window.db.collection(this.notificationsCollection).doc(notificationId).update({
                    read: true,
                    readAt: new Date()
                });
            }
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        try {
            if (!window.db) return 0;

            const snapshot = await window.db.collection(this.notificationsCollection)
                .where('read', '==', false)
                .get();

            return snapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Setup real-time listeners for orders and notifications
     */
    setupRealtimeListeners() {
        if (!window.db) return;

        // Listen to new orders (admin dashboard)
        try {
            window.db.collection(this.ordersCollection)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .onSnapshot((snapshot) => {
                    const orders = [];
                    snapshot.forEach(doc => {
                        orders.push({ id: doc.id, ...doc.data() });
                    });
                    
                    // Dispatch event for UI updates
                    window.dispatchEvent(new CustomEvent('ordersUpdated', {
                        detail: { orders }
                    }));
                    
                    console.log('✓ Orders real-time update:', orders.length);
                });
        } catch (error) {
            console.warn('Real-time order listener setup failed:', error.message);
        }

        // Listen to notifications
        try {
            window.db.collection(this.notificationsCollection)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .onSnapshot((snapshot) => {
                    const notifications = [];
                    snapshot.forEach(doc => {
                        notifications.push({ id: doc.id, ...doc.data() });
                    });
                    
                    // Dispatch event for UI updates
                    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
                        detail: { notifications }
                    }));
                    
                    console.log('✓ Notifications real-time update:', notifications.length);
                });
        } catch (error) {
            console.warn('Real-time notification listener setup failed:', error.message);
        }
    }

    /**
     * Broadcast order update across tabs/windows
     */
    broadcastOrderUpdate(eventType, data) {
        // Use BroadcastChannel if available (modern browsers)
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('africhic_orders');
                channel.postMessage({
                    type: eventType,
                    data: data,
                    timestamp: Date.now()
                });
                channel.close();
            } catch (error) {
                console.warn('BroadcastChannel not available');
            }
        }

        // Also dispatch local event
        window.dispatchEvent(new CustomEvent('orderBroadcast', {
            detail: { type: eventType, data }
        }));
    }

    /**
     * Send push notification to admin (if supported)
     */
    async sendAdminNotification(order) {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('Notifications not supported in this browser');
            return false;
        }

        // Request permission if needed
        if (Notification.permission === 'granted') {
            new Notification('New Order Received! 🎉', {
                body: `${order.customer_name} ordered ${order.items.length} item(s) for R${order.total.toFixed(2)}`,
                icon: '/images/logo.png',
                tag: 'new-order-' + order.id,
                requireInteraction: true
            });
            return true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('New Order Received! 🎉', {
                        body: `${order.customer_name} ordered ${order.items.length} item(s) for R${order.total.toFixed(2)}`,
                        icon: '/images/logo.png',
                        tag: 'new-order-' + order.id,
                        requireInteraction: true
                    });
                }
            });
        }
    }

    /**
     * Get order statistics
     */
    async getOrderStats() {
        try {
            const orders = await this.getAllOrders(1000);
            
            const stats = {
                total: orders.length,
                pending: orders.filter(o => o.status === 'pending' || o.status === 'pending_payment').length,
                completed: orders.filter(o => o.status === 'completed').length,
                shipped: orders.filter(o => o.status === 'shipped').length,
                failed: orders.filter(o => o.status === 'failed').length,
                totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
            };

            return stats;
        } catch (error) {
            console.error('Error calculating stats:', error);
            return { total: 0, pending: 0, completed: 0, shipped: 0, failed: 0, totalRevenue: 0 };
        }
    }

    /**
     * Add tracking info to order (delivery)
     */
    async addTrackingInfo(orderId, trackingData) {
        try {
            const trackingInfo = {
                tracking_number: trackingData.tracking_number,
                carrier: trackingData.carrier,
                estimated_delivery: trackingData.estimated_delivery,
                message: trackingData.message || '',
                status: 'in_transit',
                sent_at: new Date(),
                updates: [
                    {
                        status: 'in_transit',
                        timestamp: new Date(),
                        message: `Your order is on its way with ${trackingData.carrier}`
                    }
                ]
            };

            if (window.db) {
                await window.db.collection(this.ordersCollection).doc(orderId).update({
                    tracking_info: trackingInfo,
                    status: 'shipped',
                    updatedAt: new Date()
                });
                console.log('✓ Tracking info added to order:', orderId);
                this.broadcastOrderUpdate('tracking_added', { orderId, trackingInfo });
            } else {
                let orders = this.getOrdersLocally();
                orders = orders.map(o => {
                    if (o.id === orderId) {
                        o.tracking_info = trackingInfo;
                        o.status = 'shipped';
                        o.updatedAt = new Date();
                    }
                    return o;
                });
                localStorage.setItem('africhic-orders', JSON.stringify(orders));
            }
            return true;
        } catch (error) {
            console.error('Error adding tracking info:', error);
            return false;
        }
    }

    /**
     * Add collection info to order (pickup)
     */
    async addCollectionInfo(orderId, collectionData) {
        try {
            const collectionInfo = {
                ready_date: collectionData.ready_date,
                store_location: collectionData.store_location || 'Main Store',
                weekday_hours: collectionData.weekday_hours,
                saturday_hours: collectionData.saturday_hours,
                sunday_hours: collectionData.sunday_hours,
                instructions: collectionData.instructions || '',
                status: 'ready_for_pickup',
                sent_at: new Date()
            };

            if (window.db) {
                await window.db.collection(this.ordersCollection).doc(orderId).update({
                    collection_info: collectionInfo,
                    status: 'ready_for_pickup',
                    updatedAt: new Date()
                });
                console.log('✓ Collection info added to order:', orderId);
                this.broadcastOrderUpdate('collection_ready', { orderId, collectionInfo });
            } else {
                let orders = this.getOrdersLocally();
                orders = orders.map(o => {
                    if (o.id === orderId) {
                        o.collection_info = collectionInfo;
                        o.status = 'ready_for_pickup';
                        o.updatedAt = new Date();
                    }
                    return o;
                });
                localStorage.setItem('africhic-orders', JSON.stringify(orders));
            }
            return true;
        } catch (error) {
            console.error('Error adding collection info:', error);
            return false;
        }
    }

    /**
     * Update tracking status
     */
    async updateTrackingStatus(orderId, trackingUpdate) {
        try {
            if (window.db) {
                const orderRef = window.db.collection(this.ordersCollection).doc(orderId);
                const order = await orderRef.get();
                
                if (order.exists) {
                    const trackingInfo = order.data().tracking_info || {};
                    if (!trackingInfo.updates) trackingInfo.updates = [];
                    
                    trackingInfo.updates.push({
                        status: trackingUpdate.status,
                        timestamp: new Date(),
                        message: trackingUpdate.message
                    });
                    trackingInfo.status = trackingUpdate.status;

                    await orderRef.update({ tracking_info: trackingInfo });
                    console.log('✓ Tracking status updated:', orderId);
                }
            }
            return true;
        } catch (error) {
            console.error('Error updating tracking status:', error);
            return false;
        }
    }

    /**
     * Get customer's order history
     */
    async getCustomerOrders(email) {
        try {
            if (window.db) {
                const snapshot = await window.db.collection(this.ordersCollection)
                    .where('customer_email', '==', email)
                    .orderBy('createdAt', 'desc')
                    .get();

                const orders = [];
                snapshot.forEach(doc => {
                    orders.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return orders;
            } else {
                const orders = this.getOrdersLocally();
                return orders.filter(o => o.customer_email === email);
            }
        } catch (error) {
            console.error('Error loading customer orders:', error);
            return [];
        }
    }

    /**
     * Get tracking history for an order
     */
    async getTrackingHistory(orderId) {
        try {
            const order = await this.getOrderById(orderId);
            if (!order || !order.tracking_info) return [];
            
            return order.tracking_info.updates || [];
        } catch (error) {
            console.error('Error getting tracking history:', error);
            return [];
        }
    }

    /**
     * Add tracking update/notification
     */
    async addTrackingUpdate(orderId, status, message) {
        try {
            if (window.db) {
                const orderRef = window.db.collection(this.ordersCollection).doc(orderId);
                const order = await orderRef.get();
                
                if (order.exists) {
                    const trackingInfo = order.data().tracking_info || {};
                    if (!trackingInfo.updates) trackingInfo.updates = [];
                    
                    const update = {
                        status: status,
                        message: message,
                        timestamp: new Date(),
                        notified: false
                    };
                    
                    trackingInfo.updates.push(update);
                    trackingInfo.status = status;
                    trackingInfo.last_update = new Date();

                    await orderRef.update({ 
                        tracking_info: trackingInfo,
                        updatedAt: new Date()
                    });
                    
                    console.log('✓ Tracking update added:', orderId);
                    this.broadcastOrderUpdate('tracking_update', { orderId, update });
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error adding tracking update:', error);
            return false;
        }
    }

    /**
     * Send automatic tracking notifications to customer
     */
    async sendTrackingNotification(orderId, phoneNumber, message) {
        try {
            // This would integrate with your WhatsApp/SMS API
            // For now, we'll just store it
            const trackingNotification = {
                orderId: orderId,
                phone: phoneNumber,
                message: message,
                timestamp: new Date(),
                type: 'tracking_update'
            };

            if (window.db) {
                await window.db.collection('tracking_notifications').add(trackingNotification);
                console.log('✓ Tracking notification queued');
            }
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    /**
     * Mark order as delivered
     */
    async markAsDelivered(orderId, signatureData = null) {
        try {
            if (window.db) {
                await window.db.collection(this.ordersCollection).doc(orderId).update({
                    status: 'delivered',
                    delivered_at: new Date(),
                    delivery_signature: signatureData || null,
                    updatedAt: new Date()
                });
                console.log('✓ Order marked as delivered:', orderId);
                this.broadcastOrderUpdate('delivered', { orderId });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error marking order as delivered:', error);
            return false;
        }
    }

    /**
     * Mark order as collected/picked up
     */
    async markAsCollected(orderId, collectionCode = null) {
        try {
            if (window.db) {
                await window.db.collection(this.ordersCollection).doc(orderId).update({
                    status: 'collected',
                    collected_at: new Date(),
                    collection_code: collectionCode || null,
                    updatedAt: new Date()
                });
                console.log('✓ Order marked as collected:', orderId);
                this.broadcastOrderUpdate('collected', { orderId });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error marking order as collected:', error);
            return false;
        }
    }
}

// Initialize global order manager
const orderManager = new OrderManager();

console.log('✓ Orders Manager loaded');
