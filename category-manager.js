// Category Management System
// Manages product categories dynamically

class CategoryManager {
    constructor() {
        this.categories = [
            { id: 'ladies-dresses', name: 'Ladies Dresses', icon: 'fa-female', description: 'Beautiful dresses for women' },
            { id: 'ladies-skirts', name: 'Ladies Skirts', icon: 'fa-female', description: 'Stylish skirts' },
            { id: 'ladies-tops', name: 'Ladies Tops', icon: 'fa-female', description: 'Elegant tops and blouses' },
            { id: 'men-shirts', name: "Men's Shirts", icon: 'fa-male', description: 'Premium men\'s shirts' },
            { id: 'men-pants', name: "Men's Pants", icon: 'fa-male', description: 'Quality pants for men' },
            { id: 'accessories', name: 'Accessories', icon: 'fa-gem', description: 'Complete your look' }
        ];
        
        this.init();
    }

    init() {
        // Load custom categories from localStorage if available
        const stored = localStorage.getItem('africhic-categories');
        if (stored) {
            try {
                this.categories = JSON.parse(stored);
                console.log('✓ Loaded', this.categories.length, 'categories from storage');
            } catch (e) {
                console.error('Error loading categories:', e);
            }
        }
    }

    // Get all categories
    getAllCategories() {
        return this.categories;
    }

    // Get category by ID
    getCategory(categoryId) {
        return this.categories.find(c => c.id === categoryId);
    }

    // Get products by category
    getProductsByCategory(categoryId, products = []) {
        if (categoryId === 'all') return products;
        return products.filter(p => p.category === categoryId);
    }

    // Add new category
    addCategory(category) {
        if (!category.id || !category.name) {
            throw new Error('Category must have id and name');
        }
        
        // Check if already exists
        if (this.categories.find(c => c.id === category.id)) {
            throw new Error('Category already exists');
        }

        const newCategory = {
            ...category,
            icon: category.icon || 'fa-tag',
            description: category.description || category.name
        };

        this.categories.push(newCategory);
        this.saveToStorage();
        console.log('✓ Category added:', newCategory.id);
        return newCategory;
    }

    // Update category
    updateCategory(categoryId, updates) {
        const index = this.categories.findIndex(c => c.id === categoryId);
        if (index === -1) {
            throw new Error('Category not found');
        }

        this.categories[index] = {
            ...this.categories[index],
            ...updates
        };

        this.saveToStorage();
        console.log('✓ Category updated:', categoryId);
        return this.categories[index];
    }

    // Delete category
    deleteCategory(categoryId) {
        const index = this.categories.findIndex(c => c.id === categoryId);
        if (index === -1) {
            throw new Error('Category not found');
        }

        const deleted = this.categories.splice(index, 1)[0];
        this.saveToStorage();
        console.log('✓ Category deleted:', categoryId);
        return deleted;
    }

    // Get category statistics
    getCategoryStats(products = []) {
        const stats = {};
        
        this.categories.forEach(category => {
            const count = products.filter(p => p.category === category.id).length;
            stats[category.id] = {
                name: category.name,
                count: count,
                icon: category.icon
            };
        });

        return stats;
    }

    // Get category options HTML
    getCategoryOptionsHTML() {
        return this.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    }

    // Get category buttons HTML
    getCategoryButtonsHTML(activeCategory = 'all') {
        let html = `<button onclick="filterByCategory('all')" class="px-4 py-2 rounded text-sm font-medium category-filter ${activeCategory === 'all' ? 'bg-brand-gold text-white' : 'bg-white border border-gray-300 text-gray-700'}" data-category="all">
            All Products
        </button>`;

        this.categories.forEach(cat => {
            const isActive = activeCategory === cat.id;
            html += `<button onclick="filterByCategory('${cat.id}')" class="px-4 py-2 rounded text-sm font-medium category-filter ${isActive ? 'bg-brand-gold text-white' : 'bg-white border border-gray-300 text-gray-700'}" data-category="${cat.id}">
                <i class="fas ${cat.icon} mr-2"></i>${cat.name}
            </button>`;
        });

        return html;
    }

    // Save to localStorage
    saveToStorage() {
        localStorage.setItem('africhic-categories', JSON.stringify(this.categories));
        console.log('✓ Categories saved to storage');
    }

    // Export categories as JSON
    exportCategories() {
        return JSON.stringify(this.categories, null, 2);
    }

    // Import categories from JSON
    importCategories(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (!Array.isArray(imported)) {
                throw new Error('Must be an array of categories');
            }

            this.categories = imported;
            this.saveToStorage();
            console.log('✓ Categories imported:', imported.length);
            return true;
        } catch (error) {
            console.error('Error importing categories:', error);
            throw error;
        }
    }
}

// Initialize global instance
window.categoryManager = window.categoryManager || new CategoryManager();

console.log('✓ CategoryManager initialized');
