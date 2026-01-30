/**
 * Africhic Homepage Configuration Manager
 * Manages dynamic content for hero section, categories, and product sections
 */

// Get homepage configuration from localStorage or use defaults
function getHomepageConfig() {
    const stored = localStorage.getItem('africhic-homepage-config');
    return stored ? JSON.parse(stored) : getDefaultConfig();
}

// Default homepage configuration
function getDefaultConfig() {
    return {
        hero: {
            title: "Vibrant Tradition, Modern Style.",
            subtitle: "Limited edition African print dresses, shirts, and sets tailored for the modern individual.",
            image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&q=80",
            buttonText: "Shop the Collection"
        },
        categories: [
            {
                id: 1,
                name: "Ladies Wear",
                image: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80",
                link: "shop.html?cat=ladies"
            },
            {
                id: 2,
                name: "Men's Shirts",
                image: "https://images.unsplash.com/photo-1530008051860-ca82035a1609?auto=format&fit=crop&q=80",
                link: "shop.html?cat=men"
            },
            {
                id: 3,
                name: "New Arrivals",
                image: "https://images.unsplash.com/photo-1523381235312-3a1647fa9921?auto=format&fit=crop&q=80",
                link: "shop.html?cat=new"
            }
        ],
        latestArrivals: {
            title: "Latest Arrivals",
            productIds: []
        },
        newArrivals: {
            title: "New Arrivals",
            productIds: []
        },
        trending: {
            title: "What's Trending",
            description: "Check out our most popular items this season!",
            productIds: []
        }
    };
}

// Apply hero section configuration
function applyHeroSection(config) {
    const heroSection = document.querySelector('section.relative.h-\\[70vh\\]');
    if (!heroSection) return;

    // Update background image
    const backgroundImg = heroSection.querySelector('img');
    if (backgroundImg) {
        backgroundImg.src = config.hero.image;
        backgroundImg.onerror = function() {
            this.src = "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&q=80";
        };
    }

    // Update title and subtitle
    const titleElement = heroSection.querySelector('h2');
    if (titleElement) {
        titleElement.innerHTML = config.hero.title.split('\\').map((line, idx) => {
            return idx === 0 ? line : `<br> ${line}`;
        }).join('');
    }

    const subtitleElement = heroSection.querySelector('p');
    if (subtitleElement) {
        subtitleElement.textContent = config.hero.subtitle;
    }
}

// Apply browse by category section
function applyCategorySection(config) {
    const categorySection = document.querySelector('section:has(h3:contains("Browse by Category"))');
    if (!categorySection) {
        // Try alternate selector
        const sections = document.querySelectorAll('section');
        for (let section of sections) {
            if (section.textContent.includes('Browse by Category')) {
                const grid = section.querySelector('div[class*="grid"]');
                if (grid) {
                    renderCategories(config.categories, grid);
                }
                break;
            }
        }
        return;
    }

    const grid = categorySection.querySelector('div[class*="grid"]');
    if (grid) {
        renderCategories(config.categories, grid);
    }
}

// Render category items
function renderCategories(categories, container) {
    if (!container) return;

    container.innerHTML = categories.map(cat => `
        <div class="group relative overflow-hidden h-96">
            <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://via.placeholder.com/400'">
            <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <a href="${cat.link}" class="bg-white px-6 py-2 font-bold uppercase hover:bg-brand-gold hover:text-white transition">${cat.name}</a>
            </div>
        </div>
    `).join('');
}

// Apply latest arrivals section
function applyLatestArrivals(config) {
    const allProducts = JSON.parse(localStorage.getItem('africhic-products')) || [];
    const selectedProducts = allProducts.filter(p => config.latestArrivals.productIds.includes(p.id));

    if (selectedProducts.length === 0) return; // Don't show if no products selected

    // Find or create latest arrivals section
    let section = document.querySelector('section:has(h3:contains("Latest Arrivals"))');
    
    if (!section) {
        // Create section if it doesn't exist
        section = document.createElement('section');
        section.className = 'max-w-7xl mx-auto py-16 px-6';
        section.innerHTML = `
            <h3 class="text-3xl font-bold text-center mb-12">${config.latestArrivals.title}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="latest-products-grid"></div>
        `;
        
        // Insert before footer
        const footer = document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        }
    }

    // Render products
    const grid = section.querySelector('#latest-products-grid') || section.querySelector('div[class*="grid"]');
    if (grid) {
        grid.innerHTML = selectedProducts.map(p => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div class="h-64 bg-gray-200 overflow-hidden">
                    <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-full object-cover hover:scale-105 transition duration-300" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="p-4">
                    <h4 class="font-bold text-gray-800 mb-2">${p.name}</h4>
                    <p class="text-sm text-gray-600 mb-3">${p.description || 'Premium African print garment'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-brand-gold font-bold">R ${p.price.toFixed(2)}</span>
                        <button onclick="addToCartFromHome('${p.id}')" class="bg-brand-gold text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Add</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Apply new arrivals section
function applyNewArrivals(config) {
    const allProducts = JSON.parse(localStorage.getItem('africhic-products')) || [];
    const selectedProducts = allProducts.filter(p => config.newArrivals.productIds.includes(p.id));

    if (selectedProducts.length === 0) return;

    let section = document.querySelector('section:has(h3:contains("New Arrivals"))');
    
    if (!section) {
        section = document.createElement('section');
        section.className = 'max-w-7xl mx-auto py-16 px-6 bg-gray-50';
        section.innerHTML = `
            <h3 class="text-3xl font-bold text-center mb-12">${config.newArrivals.title}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="new-products-grid"></div>
        `;
        
        const footer = document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        }
    }

    const grid = section.querySelector('#new-products-grid') || section.querySelector('div[class*="grid"]');
    if (grid) {
        grid.innerHTML = selectedProducts.map(p => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div class="h-56 bg-gray-200 overflow-hidden relative">
                    <span class="absolute top-3 right-3 bg-brand-gold text-white px-2 py-1 rounded text-xs font-bold z-10">NEW</span>
                    <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-full object-cover hover:scale-105 transition duration-300" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="p-3">
                    <h4 class="font-bold text-gray-800 text-sm mb-2">${p.name}</h4>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${p.description || 'Premium African print'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-brand-gold font-bold text-lg">R ${p.price.toFixed(2)}</span>
                        <button onclick="addToCartFromHome('${p.id}')" class="bg-brand-gold text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Add</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Apply trending section
function applyTrending(config) {
    const allProducts = JSON.parse(localStorage.getItem('africhic-products')) || [];
    const selectedProducts = allProducts.filter(p => config.trending.productIds.includes(p.id));

    if (selectedProducts.length === 0) return;

    let section = document.querySelector('section:has(h3:contains("What\'s Trending"))') || 
                  document.querySelector('section:has(h3:contains("Trending"))');
    
    if (!section) {
        section = document.createElement('section');
        section.className = 'max-w-7xl mx-auto py-16 px-6';
        section.innerHTML = `
            <div class="mb-8">
                <h3 class="text-3xl font-bold mb-2">${config.trending.title}</h3>
                <p class="text-gray-600">${config.trending.description}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="trending-products-grid"></div>
        `;
        
        const footer = document.querySelector('footer');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        }
    }

    const grid = section.querySelector('#trending-products-grid') || section.querySelector('div[class*="grid"]');
    if (grid) {
        grid.innerHTML = selectedProducts.map(p => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border-2 border-brand-gold">
                <div class="h-56 bg-gray-200 overflow-hidden relative">
                    <span class="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">🔥 TRENDING</span>
                    <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-full object-cover hover:scale-105 transition duration-300" onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="p-3">
                    <h4 class="font-bold text-gray-800 text-sm mb-2">${p.name}</h4>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${p.description || 'Customer favorite'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-brand-gold font-bold text-lg">R ${p.price.toFixed(2)}</span>
                        <button onclick="addToCartFromHome('${p.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Add</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Add to cart from homepage
function addToCartFromHome(productId) {
    const allProducts = JSON.parse(localStorage.getItem('africhic-products')) || [];
    const product = allProducts.find(p => p.id === productId);

    if (!product) {
        alert('Product not found');
        return;
    }

    // Redirect to shop with size selector
    window.location.href = `shop.html#select-size-${productId}`;
}

// Initialize homepage on page load
function initializeHomepage() {
    const config = getHomepageConfig();

    // Apply all sections
    applyHeroSection(config);
    applyCategorySection(config);
    applyLatestArrivals(config);
    applyNewArrivals(config);
    applyTrending(config);
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomepage);
} else {
    initializeHomepage();
}

// Expose functions globally
window.initializeHomepage = initializeHomepage;
window.getHomepageConfig = getHomepageConfig;
window.addToCartFromHome = addToCartFromHome;
