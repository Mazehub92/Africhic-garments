// Session Timeout Manager
// Automatically logs out users after a period of inactivity
// Inactivity is reset on user interaction (mouse, keyboard, touch)

class SessionTimeoutManager {
    constructor(timeoutMinutes = 30) {
        this.timeoutMinutes = timeoutMinutes;
        this.timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds
        this.warningMs = this.timeoutMs - (5 * 60 * 1000); // Warn 5 minutes before timeout
        this.timeoutId = null;
        this.warningShown = false;
        this.isActive = false;
        
        this.initialize();
    }

    initialize() {
        // Only activate if user is logged in
        window.addEventListener('authStateChanged', (e) => {
            if (e.detail.type === 'login') {
                this.start();
            } else if (e.detail.type === 'logout') {
                this.stop();
            }
        });

        // Check if user is already logged in
        if (typeof authManager !== 'undefined' && authManager.isLoggedIn()) {
            this.start();
        }
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.warningShown = false;
        this.resetTimer();
        
        // Setup activity listeners
        this.setupActivityListeners();
        
        console.log(`✓ Session timeout enabled: ${this.timeoutMinutes} minutes of inactivity`);
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.isActive = false;
        this.removeActivityListeners();
        this.hideWarning();
        console.log('✓ Session timeout disabled');
    }

    setupActivityListeners() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, this.onUserActivity.bind(this), true);
        });
    }

    removeActivityListeners() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.removeEventListener(event, this.onUserActivity.bind(this), true);
        });
    }

    onUserActivity() {
        if (this.isActive) {
            // Reset the inactivity timer
            this.resetTimer();
            // Reset warning flag
            this.warningShown = false;
            this.hideWarning();
        }
    }

    resetTimer() {
        // Clear existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Set warning timer (5 minutes before logout)
        setTimeout(() => {
            if (this.isActive && !this.warningShown) {
                this.showWarning();
                this.warningShown = true;
            }
        }, this.warningMs);

        // Set logout timer
        this.timeoutId = setTimeout(() => {
            if (this.isActive) {
                this.logout();
            }
        }, this.timeoutMs);
    }

    showWarning() {
        const existingWarning = document.getElementById('session-timeout-warning');
        if (existingWarning) return; // Don't show multiple warnings

        const warningHtml = `
            <div id="session-timeout-warning" class="fixed top-0 left-0 right-0 bg-orange-500 text-white z-[9999]">
                <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-exclamation-triangle"></i>
                        <div>
                            <p class="font-semibold">Session Expiring Soon</p>
                            <p class="text-sm opacity-90">Your session will expire in 5 minutes due to inactivity. Click anywhere to stay logged in.</p>
                        </div>
                    </div>
                    <button onclick="sessionTimeoutManager.extendSession()" class="bg-white text-orange-500 px-4 py-2 rounded font-semibold hover:bg-orange-50 transition">
                        Stay Logged In
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', warningHtml);
    }

    hideWarning() {
        const warning = document.getElementById('session-timeout-warning');
        if (warning) {
            warning.remove();
        }
    }

    extendSession() {
        this.resetTimer();
        this.hideWarning();
        this.warningShown = false;
        console.log('✓ Session extended');
    }

    async logout() {
        this.stop();
        
        if (typeof authManager !== 'undefined') {
            const result = await authManager.logout();
            
            // Show logout message
            const message = document.createElement('div');
            message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-2xl text-center z-[10000]';
            message.innerHTML = `
                <i class="fa-solid fa-clock text-4xl text-orange-500 mb-4 block"></i>
                <p class="text-lg font-semibold text-gray-900 mb-2">Session Expired</p>
                <p class="text-gray-600 mb-4">Your session expired due to inactivity. Please log in again.</p>
                <a href="login.html" class="inline-block bg-brand-gold text-white px-6 py-2 rounded font-semibold hover:bg-yellow-600 transition">
                    Go to Login
                </a>
            `;
            document.body.appendChild(message);
            
            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
    }
}

// Create global instance with 30-minute timeout
const sessionTimeoutManager = new SessionTimeoutManager(30); // 30 minutes of inactivity

// Also initialize if auth.js loads first
if (typeof window !== 'undefined') {
    if (typeof authManager !== 'undefined' && authManager.isLoggedIn()) {
        sessionTimeoutManager.start();
    }
}
