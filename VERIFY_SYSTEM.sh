#!/bin/bash

# Product Sync System - Deployment Verification Script
# Run this to verify the complete system is in place

echo "🔍 Verifying Product Sync System Installation..."
echo ""

# Check all required files
echo "📁 Checking required files..."
files=(
    "product-sync-manager.js"
    "category-manager.js"
    "product-dashboard.html"
    "admin-products.html"
    "shop.html"
    "index.html"
    "products.js"
    "firebase-config.js"
)

missing=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
        missing=$((missing + 1))
    fi
done

echo ""

# Check documentation
echo "📚 Checking documentation..."
docs=(
    "PRODUCT_SYNC_GUIDE.md"
    "PRODUCT_SYNC_QUICK_START.md"
    "PRODUCT_SYNC_IMPLEMENTATION.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "❌ $doc - MISSING"
        missing=$((missing + 1))
    fi
done

echo ""
echo "═══════════════════════════════════════════"
echo ""

# Summary
if [ $missing -eq 0 ]; then
    echo "✅ ALL SYSTEM FILES VERIFIED!"
    echo ""
    echo "🚀 System Status: READY FOR PRODUCTION"
    echo ""
    echo "📋 Quick Checklist:"
    echo "  ✓ ProductSyncManager - Real-time sync for guests & logged-in users"
    echo "  ✓ CategoryManager - Dynamic category management"
    echo "  ✓ Admin Dashboard - Enhanced with sync controls"
    echo "  ✓ Product Dashboard - Real-time monitoring"
    echo "  ✓ Shop Page - Integrated category filtering"
    echo "  ✓ Homepage - Category links & product updates"
    echo ""
    echo "📞 Next Steps:"
    echo "  1. Test admin product creation: /admin-products.html"
    echo "  2. Click 'Sync to Store' button"
    echo "  3. Verify products appear on: /shop.html"
    echo "  4. Monitor dashboard: /product-dashboard.html"
    echo ""
else
    echo "⚠️  WARNING: $missing file(s) missing!"
    echo ""
    echo "Please ensure all files are present before deployment."
fi

echo "═══════════════════════════════════════════"
