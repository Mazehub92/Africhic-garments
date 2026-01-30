// Page Protection & Authorization Module
// Protects pages and redirects unauthenticated users

class PageProtection {
    constructor(requiredAuth = false, requiredRole = null) {
        this.requiredAuth = requiredAuth;
        this.requiredRole = requiredRole;
        this.checkAccess();
    }

    checkAccess() {
        if (this.requiredAuth) {
            this.protectPage();
        }
    }

    protectPage() {
        // Wait for auth to be initialized
        const checkAuth = setInterval(() => {
            if (authManager && authManager.initialized) {
                clearInterval(checkAuth);
                
                if (!authManager.isLoggedIn()) {
                    // Redirect to login
                    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
                } else if (this.requiredRole) {
                    // Check user role
                    const user = authManager.getCurrentUser();
                    if (!this.hasRole(user, this.requiredRole)) {
                        window.location.href = 'index.html';
                    } else {
                        this.initPageWithUser(user);
                    }
                } else {
                    // User is authenticated
                    const user = authManager.getCurrentUser();
                    this.initPageWithUser(user);
                }
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            if (!authManager.initialized) {
                console.warn('Auth not initialized, checking localStorage');
                if (!authManager.isLoggedIn()) {
                    window.location.href = 'login.html';
                }
            }
        }, 5000);
    }

    hasRole(user, requiredRole) {
        // Check if user has required role
        const userRoles = localStorage.getItem('user-roles-' + user.uid) || '';
        return userRoles.includes(requiredRole);
    }

    initPageWithUser(user) {
        // Called when user is authenticated
        console.log('✓ Page access granted for:', user.email);
        
        // Dispatch event for page to handle user info
        window.dispatchEvent(new CustomEvent('userAuthenticated', {
            detail: { user: user }
        }));
    }
}

// Check for redirect parameter
function handleLoginRedirect() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    if (redirect && authManager.isLoggedIn()) {
        window.location.href = redirect;
    }
}

// Add logout functionality to navbar
function addLogoutButton() {
    // Check if user is logged in and add logout button
    const logoutHandler = () => {
        const user = authManager.getCurrentUser();
        if (user) {
            const logoutBtn = document.createElement('button');
            logoutBtn.innerHTML = `
                <i class="fa-solid fa-sign-out mr-2"></i>
                <span class="hidden md:inline">Logout</span>
            `;
            logoutBtn.className = 'text-sm font-medium hover:text-brand-gold cursor-pointer';
            logoutBtn.onclick = handleLogout;
            
            // Find the nav container
            const nav = document.querySelector('nav');
            if (nav) {
                const userDisplay = document.createElement('span');
                userDisplay.className = 'text-xs md:text-sm text-gray-600 mr-4';
                userDisplay.textContent = `Hi, ${user.displayName || user.email.split('@')[0]}`;
                
                nav.appendChild(userDisplay);
                nav.appendChild(logoutBtn);
            }
        }
    };

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logoutHandler);
    } else {
        logoutHandler();
    }
}

async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        await authManager.logout();
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    handleLoginRedirect();
    
    // Listen for auth state changes
    window.addEventListener('authStateChanged', function(e) {
        if (e.detail.type === 'logout') {
            // Redirect to home if not already on login page
            if (!window.location.pathname.includes('login')) {
                window.location.href = 'index.html';
            }
        }
    });
});

// Global function to get current user
function getCurrentUser() {
    return authManager.getCurrentUser();
}

// Global function to check if logged in
function isLoggedIn() {
    return authManager.isLoggedIn();
}

// Global function to require authentication
function requireAuth() {
    return new PageProtection(true);
}

// Global function to require admin role
function requireAdmin() {
    return new PageProtection(true, 'admin');
}
