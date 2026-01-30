// Modern Navigation Bar System
// Handles mobile menu toggle and dropdown menus

class ModernNavbar {
    constructor() {
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.navLinks = document.querySelectorAll('.nav-link-dropdown');
        this.init();
    }

    init() {
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Dropdown menu handlers
        this.navLinks.forEach(link => {
            const dropdown = link.querySelector('.dropdown-menu');
            if (dropdown) {
                link.addEventListener('click', (e) => {
                    if (window.innerWidth < 768) {
                        e.preventDefault();
                        this.toggleDropdown(link, dropdown);
                    }
                });

                link.addEventListener('mouseenter', () => {
                    if (window.innerWidth >= 768) {
                        this.showDropdown(dropdown);
                    }
                });

                link.parentElement.addEventListener('mouseleave', () => {
                    if (window.innerWidth >= 768) {
                        this.hideDropdown(dropdown);
                    }
                });
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleMobileMenu() {
        this.mobileMenu.classList.toggle('hidden');
        this.mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
        this.mobileMenuBtn.querySelector('i').classList.toggle('fa-times');

        // Close dropdowns when closing mobile menu
        if (this.mobileMenu.classList.contains('hidden')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    }

    toggleDropdown(link, dropdown) {
        const isHidden = dropdown.classList.contains('hidden');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu !== dropdown) {
                menu.classList.add('hidden');
            }
        });

        // Toggle this dropdown
        if (isHidden) {
            this.showDropdown(dropdown);
        } else {
            this.hideDropdown(dropdown);
        }
    }

    showDropdown(dropdown) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('fadeIn');
    }

    hideDropdown(dropdown) {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('fadeIn');
    }

    handleClickOutside(e) {
        // Close mobile menu when clicking outside
        if (this.mobileMenu && !this.mobileMenu.contains(e.target) && !this.mobileMenuBtn.contains(e.target)) {
            if (!this.mobileMenu.classList.contains('hidden')) {
                this.toggleMobileMenu();
            }
        }

        // Close dropdown when clicking outside (mobile)
        if (window.innerWidth < 768) {
            const dropdown = e.target.closest('.nav-link-dropdown');
            if (!dropdown) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        }
    }

    handleResize() {
        // Reset mobile menu state on resize
        if (window.innerWidth >= 768) {
            this.mobileMenu.classList.add('hidden');
            this.mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            this.mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            
            // Close all dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ModernNavbar();
    });
} else {
    new ModernNavbar();
}
