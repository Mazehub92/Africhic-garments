// User Profile Display Component
// Handles displaying logged-in user information in the navbar professionally

class UserProfileDisplay {
    constructor() {
        this.user = null;
        this.initializeProfile();
    }

    initializeProfile() {
        // First, try to load user from localStorage immediately
        const storedUser = localStorage.getItem('africhic-user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                this.updateProfileDisplay();
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
        
        // Check for user profile elements in navbar and ensure DOM is ready
        const userDropdown = document.getElementById('user-profile-dropdown');
        const loginIcon = document.getElementById('login-icon');
        
        // If DOM elements aren't ready yet, wait for them
        if (!userDropdown && !loginIcon) {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateProfileDisplay();
            });
        }
        
        // Listen for auth changes
        window.addEventListener('auth-login', (e) => {
            this.user = e.detail;
            this.updateProfileDisplay();
        });

        window.addEventListener('auth-logout', () => {
            this.user = null;
            this.updateProfileDisplay();
        });
    }

    updateProfileDisplay() {
        const user = this.getUser();
        const userDropdown = document.getElementById('user-profile-dropdown');
        const loginIcon = document.getElementById('login-icon');
        const mobileUserSection = document.getElementById('mobile-user-section');
        const mobileLoginLink = document.getElementById('mobile-login-link');
        
        if (user) {
            // User is logged in - show profile dropdown
            if (userDropdown) {
                userDropdown.classList.remove('hidden');
            }
            if (loginIcon) {
                loginIcon.classList.add('hidden');
            }
            if (mobileUserSection) {
                mobileUserSection.classList.remove('hidden');
            }
            if (mobileLoginLink) {
                mobileLoginLink.classList.add('hidden');
            }
            
            // Update profile info in navbar
            this.updateNavbarProfileInfo(user);
        } else {
            // User is not logged in - show login icon
            if (userDropdown) {
                userDropdown.classList.add('hidden');
            }
            if (loginIcon) {
                loginIcon.classList.remove('hidden');
            }
            if (mobileUserSection) {
                mobileUserSection.classList.add('hidden');
            }
            if (mobileLoginLink) {
                mobileLoginLink.classList.remove('hidden');
            }
        }
    }

    updateNavbarProfileInfo(user) {
        // Update desktop navbar profile dropdown
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileIcon = document.getElementById('profile-icon');
        
        if (profileName) {
            profileName.textContent = user.displayName || 'Customer';
        }
        if (profileEmail) {
            profileEmail.textContent = user.email || '';
        }
        if (profileAvatar) {
            profileAvatar.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
            profileAvatar.classList.remove('hidden');
        }
        if (profileIcon) {
            profileIcon.classList.add('hidden');
        }
        
        // Update mobile navbar profile section
        const mobileProfileName = document.getElementById('mobile-profile-name');
        const mobileProfileEmail = document.getElementById('mobile-profile-email');
        
        if (mobileProfileName) {
            mobileProfileName.textContent = user.displayName || 'Customer';
        }
        if (mobileProfileEmail) {
            mobileProfileEmail.textContent = user.email || '';
        }
    }

    hideProfile() {
        const userDropdown = document.getElementById('user-profile-dropdown');
        const loginIcon = document.getElementById('login-icon');
        
        if (userDropdown) {
            userDropdown.classList.add('hidden');
        }
        if (loginIcon) {
            loginIcon.classList.remove('hidden');
        }
    }

    getUser() {
        if (this.user) return this.user;
        
        const stored = localStorage.getItem('africhic-user');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    async logout() {
        if (typeof authManager !== 'undefined') {
            const result = await authManager.logout();
            if (result.success) {
                window.location.href = 'login.html';
            }
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.userProfileDisplay = new UserProfileDisplay();
    });
} else {
    window.userProfileDisplay = new UserProfileDisplay();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.userProfileDisplay = new UserProfileDisplay();
    });
} else {
    window.userProfileDisplay = new UserProfileDisplay();
}
