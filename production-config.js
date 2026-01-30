// Production Environment Configuration
// This file configures the Africhic Garments store for production deployment

console.log('[Production] Initializing Production Configuration...');

// ========================================
// PRODUCTION ENVIRONMENT SETTINGS
// ========================================

const ProductionConfig = {
    // Application Environment
    environment: 'production',
    version: '1.0.0',
    lastUpdated: '2024-01-30',
    
    // ========================================
    // FEATURE FLAGS
    // ========================================
    features: {
        firebaseAuth: true,           // ✓ Firebase authentication enabled
        firebaseStorage: true,         // ✓ Cloud image storage enabled
        firestoreSync: true,          // ✓ Cloud database sync enabled
        paymentProcessing: true,      // ✓ Paystack payments enabled
        realTimeUpdates: true,        // ✓ Real-time data updates enabled
        userAccounts: true,           // ✓ User registration and login enabled
        orderTracking: true,          // ✓ Order management enabled
        adminDashboard: true,         // ✓ Admin panel enabled
    },
    
    // ========================================
    // DATA STORAGE STRATEGY
    // ========================================
    storage: {
        primary: 'firestore',         // Primary data source
        cache: 'localStorage',        // Local cache for offline support
        sync: 'bidirectional',        // Sync in both directions
        syncInterval: 5000,           // Sync every 5 seconds (ms)
        conflictResolution: 'serverWins'  // Server data takes priority
    },
    
    // ========================================
    // AUTHENTICATION
    // ========================================
    auth: {
        provider: 'firebase',
        mode: 'production',
        persistSession: true,
        sessionTimeout: 3600000,      // 1 hour in milliseconds
        maxLoginAttempts: 5,
        lockoutDuration: 900000,      // 15 minutes in milliseconds
    },
    
    // ========================================
    // ADMIN SETTINGS
    // ========================================
    admin: {
        requireFirebaseAuth: true,    // Require Firebase Auth for admin login
        allowLocalAuth: true,         // Allow fallback to local credentials (for emergencies)
        checkAdminStatus: false,      // Don't enforce admin role checking (set to true if Firestore admin records exist)
        credentialsUpdateRequired: false  // Set to true to force password change on next login
    },
    
    // ========================================
    // PERFORMANCE OPTIMIZATION
    // ========================================
    performance: {
        enableImageCompression: true,
        maxImageSize: 5242880,        // 5MB
        cacheProducts: true,
        cacheDuration: 3600000,       // 1 hour
        enableLazyLoading: true,
        enableServiceWorker: false    // Set to true after creating service-worker.js
    },
    
    // ========================================
    // PAYMENT CONFIGURATION
    // ========================================
    payments: {
        provider: 'paystack',
        mode: 'production',
        publicKey: 'pk_live_YOUR_PUBLIC_KEY_HERE',  // Replace with actual key from Paystack
        currency: 'ZAR',
        minAmount: 10,
        maxAmount: 999999,
        requireEmailVerification: false,
        enableTestMode: false
    },
    
    // ========================================
    // DATABASE CONFIGURATION
    // ========================================
    database: {
        firestore: {
            projectId: 'africhic-garments',
            collections: {
                products: 'stores/{storeId}/products',
                orders: 'orders',
                users: 'users',
                admins: 'admins',
                notifications: 'admin_notifications',
                homepage: 'homepage_config'
            }
        }
    },
    
    // ========================================
    // STORAGE CONFIGURATION
    // ========================================
    storage: {
        firebase: {
            bucket: 'africhic-garments.firebasestorage.app',
            paths: {
                products: 'products/',
                homepage: 'homepage/',
                userProfiles: 'profiles/'
            }
        }
    },
    
    // ========================================
    // LOGGING & MONITORING
    // ========================================
    logging: {
        level: 'info',                // 'debug', 'info', 'warn', 'error'
        enableConsole: true,
        enableRemote: false,          // Set to true to send logs to remote server
        maxLogSize: 1000,             // Keep last 1000 logs
        excludePatterns: []           // Patterns to exclude from logging
    },
    
    // ========================================
    // ERROR HANDLING
    // ========================================
    errorHandling: {
        enableErrorBoundary: true,
        showDetailedErrors: false,    // Don't show technical errors to users
        enableErrorReporting: false,  // Set to true to report errors to server
        fallbackBehavior: 'graceful'  // 'graceful' or 'strict'
    },
    
    // ========================================
    // API ENDPOINTS
    // ========================================
    api: {
        baseUrl: window.location.origin,
        timeout: 30000,               // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000              // 1 second
    },
    
    // ========================================
    // SECURITY
    // ========================================
    security: {
        enableHTTPS: true,
        enableCSP: true,              // Content Security Policy
        enableXFrameOptions: true,
        enableXSSProtection: true,
        restrictCookies: true,
        enableRateLimiting: true
    }
};

// ========================================
// VALIDATION FUNCTION
// ========================================
function validateProductionConfig() {
    console.group('[Production] Configuration Validation');
    
    const issues = [];
    
    // Check required features
    if (!ProductionConfig.features.firebaseAuth) {
        issues.push('⚠️ Firebase Auth is disabled');
    }
    
    if (!ProductionConfig.features.firestoreSync) {
        issues.push('⚠️ Firestore Sync is disabled');
    }
    
    // Check payment configuration
    if (ProductionConfig.payments.enableTestMode) {
        issues.push('⚠️ Payment processor in TEST MODE - not suitable for production');
    }
    
    // Check logging
    if (ProductionConfig.logging.level === 'debug') {
        issues.push('⚠️ Logging level set to DEBUG - should be INFO or higher for production');
    }
    
    // Check error handling
    if (ProductionConfig.errorHandling.showDetailedErrors) {
        issues.push('⚠️ Detailed errors enabled - security risk in production');
    }
    
    // Check security settings
    if (!ProductionConfig.security.enableHTTPS) {
        issues.push('❌ CRITICAL: HTTPS not enabled - must be enabled for production');
    }
    
    if (issues.length === 0) {
        console.log('✓ All production configuration checks passed');
    } else {
        console.warn('Issues found:', issues.length);
        issues.forEach(issue => console.warn(issue));
    }
    
    console.groupEnd();
    return issues.length === 0;
}

// ========================================
// INITIALIZATION
// ========================================
function initializeProductionMode() {
    console.group('[Production] Initializing Production Mode');
    
    // Validate configuration
    const isValid = validateProductionConfig();
    
    if (!isValid) {
        console.warn('[Production] Configuration issues detected - some features may not work correctly');
    }
    
    // Apply settings globally
    window.PRODUCTION_MODE = ProductionConfig;
    
    // Log production configuration
    console.log('[Production] Configuration loaded successfully');
    console.log('[Production] Environment:', ProductionConfig.environment);
    console.log('[Production] Features enabled:', Object.keys(ProductionConfig.features).filter(k => ProductionConfig.features[k]));
    console.log('[Production] Data storage strategy:', ProductionConfig.storage.primary);
    
    console.groupEnd();
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get a configuration value by path
 * Usage: getConfigValue('payments.provider') => 'paystack'
 */
function getConfigValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], ProductionConfig);
}

/**
 * Update a configuration value
 */
function updateConfigValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const obj = keys.reduce((acc, key) => acc[key] = acc[key] || {}, ProductionConfig);
    obj[lastKey] = value;
    console.log(`[Production] Updated ${path} to:`, value);
}

/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(feature) {
    return ProductionConfig.features[feature] === true;
}

// ========================================
// AUTO-INITIALIZE ON LOAD
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductionMode);
} else {
    initializeProductionMode();
}

// Make functions globally available
window.ProductionConfig = ProductionConfig;
window.validateProductionConfig = validateProductionConfig;
window.initializeProductionMode = initializeProductionMode;
window.getConfigValue = getConfigValue;
window.updateConfigValue = updateConfigValue;
window.isFeatureEnabled = isFeatureEnabled;

console.log('[Production] Configuration script loaded successfully');
