// Firebase Authentication Module for Africhic Garments
// Handles user registration, login, logout, and session management

class AuthManager {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.initializeAuth();
    }

    initializeAuth() {
        // Wait for Firebase to be initialized
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                clearInterval(checkFirebase);
                this.setupAuthStateListener();
                this.initialized = true;
                console.log('✓ Auth Manager initialized');
            }
        }, 100);

        // Fallback timeout after 10 seconds
        setTimeout(() => {
            if (!this.initialized) {
                this.useLocalAuth();
                this.initialized = true;
            }
        }, 10000);
    }

    setupAuthStateListener() {
        try {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: user.metadata.creationTime
                    };
                    localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));
                    localStorage.setItem('isLoggedIn', 'true');
                    console.log('✓ User authenticated:', this.currentUser.email);
                    this.dispatchAuthEvent('login', this.currentUser);
                } else {
                    this.currentUser = null;
                    localStorage.removeItem('africhic-user');
                    localStorage.removeItem('isLoggedIn');
                    console.log('✓ User logged out');
                    this.dispatchAuthEvent('logout');
                }
            });
        } catch (error) {
            console.error('Auth listener error:', error);
            this.useLocalAuth();
        }
    }

    // Register new user
    async register(email, password, displayName) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && this.initialized) {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                
                // Set display name
                await userCredential.user.updateProfile({
                    displayName: displayName
                });

                this.currentUser = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: displayName,
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));
                localStorage.setItem('isLoggedIn', 'true');

                console.log('✓ User registered:', email);
                this.dispatchAuthEvent('register', this.currentUser);
                
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'Account created successfully!'
                };
            } else {
                // Fallback: local authentication
                return this.registerLocal(email, password, displayName);
            }
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Login user
    async login(email, password) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && this.initialized) {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                
                this.currentUser = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: userCredential.user.displayName,
                    createdAt: userCredential.user.metadata.creationTime
                };

                localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));
                localStorage.setItem('isLoggedIn', 'true');

                console.log('✓ User logged in:', email);
                this.dispatchAuthEvent('login', this.currentUser);

                return {
                    success: true,
                    user: this.currentUser,
                    message: 'Login successful!'
                };
            } else {
                // Fallback: local authentication
                return this.loginLocal(email, password);
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Logout user
    async logout() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('africhic-user');
            localStorage.removeItem('isLoggedIn');
            
            console.log('✓ User logged out');
            this.dispatchAuthEvent('logout');
            
            return { success: true, message: 'Logged out successfully!' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const stored = localStorage.getItem('africhic-user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                return this.currentUser;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true' || this.currentUser !== null;
    }

    // FALLBACK: Local authentication (if Firebase unavailable)
    registerLocal(email, password, displayName) {
        try {
            // Get existing users
            let users = JSON.parse(localStorage.getItem('africhic-users')) || {};
            
            // Check if user already exists
            if (users[email]) {
                return {
                    success: false,
                    error: 'Email already registered'
                };
            }

            // Validate password strength
            if (password.length < 6) {
                return {
                    success: false,
                    error: 'Password must be at least 6 characters'
                };
            }

            // Create new user
            const uid = 'local_' + Date.now();
            const hashedPassword = btoa(email + password); // Simple encoding (not secure for production)
            
            users[email] = {
                uid: uid,
                email: email,
                displayName: displayName,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('africhic-users', JSON.stringify(users));

            this.currentUser = {
                uid: uid,
                email: email,
                displayName: displayName,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));
            localStorage.setItem('isLoggedIn', 'true');

            console.log('✓ Local user registered:', email);
            this.dispatchAuthEvent('register', this.currentUser);

            return {
                success: true,
                user: this.currentUser,
                message: 'Account created successfully!'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    loginLocal(email, password) {
        try {
            const users = JSON.parse(localStorage.getItem('africhic-users')) || {};
            const user = users[email];

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            const hashedPassword = btoa(email + password);
            if (user.password !== hashedPassword) {
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt
            };

            localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));
            localStorage.setItem('isLoggedIn', 'true');

            console.log('✓ Local user logged in:', email);
            this.dispatchAuthEvent('login', this.currentUser);

            return {
                success: true,
                user: this.currentUser,
                message: 'Login successful!'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Password reset
    async resetPassword(email) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().sendPasswordResetEmail(email);
                return {
                    success: true,
                    message: 'Password reset email sent'
                };
            } else {
                return {
                    success: false,
                    error: 'Firebase not available'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update user profile
    async updateProfile(displayName, photoURL = null) {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                await firebase.auth().currentUser.updateProfile({
                    displayName: displayName,
                    photoURL: photoURL
                });

                this.currentUser.displayName = displayName;
                if (photoURL) this.currentUser.photoURL = photoURL;

                localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));

                return {
                    success: true,
                    message: 'Profile updated successfully!'
                };
            } else {
                // Fallback: update local user
                const users = JSON.parse(localStorage.getItem('africhic-users')) || {};
                const email = this.currentUser.email;
                if (users[email]) {
                    users[email].displayName = displayName;
                    localStorage.setItem('africhic-users', JSON.stringify(users));
                }

                this.currentUser.displayName = displayName;
                localStorage.setItem('africhic-user', JSON.stringify(this.currentUser));

                return {
                    success: true,
                    message: 'Profile updated successfully!'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Dispatch custom event for auth changes
    dispatchAuthEvent(eventType, user = null) {
        const event = new CustomEvent('authStateChanged', {
            detail: { type: eventType, user: user }
        });
        window.dispatchEvent(event);
        
        // Also dispatch legacy events for backwards compatibility
        if (eventType === 'login') {
            const loginEvent = new CustomEvent('auth-login', { detail: user });
            window.dispatchEvent(loginEvent);
        } else if (eventType === 'logout') {
            const logoutEvent = new CustomEvent('auth-logout');
            window.dispatchEvent(logoutEvent);
        }
    }

    // Use local auth (fallback)
    useLocalAuth() {
        console.log('⚠ Firebase unavailable - using local authentication');
        const stored = localStorage.getItem('africhic-user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }
}

// Create global instance
const authManager = new AuthManager();

// Listen for storage changes (logout from other tabs)
window.addEventListener('storage', function(e) {
    if (e.key === 'isLoggedIn' && e.newValue !== 'true') {
        authManager.currentUser = null;
        authManager.dispatchAuthEvent('logout');
    } else if (e.key === 'africhic-user') {
        if (e.newValue) {
            try {
                authManager.currentUser = JSON.parse(e.newValue);
                authManager.dispatchAuthEvent('login', authManager.currentUser);
            } catch (error) {
                console.error('Error parsing user from storage:', error);
            }
        }
    }
});
