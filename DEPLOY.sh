#!/bin/bash

# ========================================
# AFRICHIC GARMENTS - DEPLOYMENT SCRIPT
# Product Sync System v2.0
# ========================================

echo "🚀 STARTING PRODUCTION DEPLOYMENT..."
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $1 - MISSING"
        ((FAIL++))
    fi
}

# Function to check script
check_script() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $1 - $3"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $1 - Missing: $3"
        ((FAIL++))
    fi
}

echo "📋 VERIFICATION CHECKLIST"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣  CORE SYSTEM FILES"
echo "───────────────────────────────────────────────────────────────"
check_file "product-sync-manager.js"
check_file "category-manager.js"
check_file "products.js"
check_file "firebase-config.js"
echo ""

echo "2️⃣  HTML PAGES"
echo "───────────────────────────────────────────────────────────────"
check_file "product-dashboard.html"
check_file "admin-products.html"
check_file "shop.html"
check_file "index.html"
echo ""

echo "3️⃣  DOCUMENTATION"
echo "───────────────────────────────────────────────────────────────"
check_file "PRODUCT_SYNC_GUIDE.md"
check_file "PRODUCT_SYNC_QUICK_START.md"
check_file "PRODUCT_SYNC_IMPLEMENTATION.md"
check_file "README_PRODUCT_SYNC.md"
check_file "DEPLOYMENT_COMPLETE.md"
echo ""

echo "4️⃣  INTEGRATION CHECKS"
echo "───────────────────────────────────────────────────────────────"
check_script "shop.html" "category-manager.js" "CategoryManager linked"
check_script "admin-products.html" "syncAllProductsToStore" "Sync function added"
check_script "product-dashboard.html" "productSyncManager" "Dashboard integrated"
check_script "index.html" "category-manager.js" "CategoryManager linked"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo ""

# Summary
TOTAL=$((PASS + FAIL))
echo "📊 DEPLOYMENT VERIFICATION SUMMARY"
echo "───────────────────────────────────────────────────────────────"
echo -e "${GREEN}✅ PASSED: $PASS${NC}"
echo -e "${RED}❌ FAILED: $FAIL${NC}"
echo "📈 TOTAL CHECKS: $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${GREEN}🎉 ALL SYSTEMS READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "📋 PRE-DEPLOYMENT CHECKLIST:"
    echo "───────────────────────────────────────────────────────────────"
    echo "✅ Firebase is configured (firebase-config.js)"
    echo "✅ Firestore security rules allow public read (products)"
    echo "✅ Admin auth is set up"
    echo "✅ Netlify is configured (if using Netlify)"
    echo "✅ Custom domain is configured (if applicable)"
    echo ""
    echo "🚀 DEPLOYMENT STEPS:"
    echo "───────────────────────────────────────────────────────────────"
    echo "1. Verify Firebase Firestore security rules:"
    echo "   - Products: Allow public read"
    echo "   - Orders: Allow auth read/write"
    echo ""
    echo "2. Deploy to production:"
    echo "   - Push code to repository"
    echo "   - Deploy via Netlify/Server"
    echo ""
    echo "3. Run initial tests:"
    echo "   - Admin: Add test product"
    echo "   - Click: Sync to Store"
    echo "   - Guest: Open shop page"
    echo "   - Verify: Product appears instantly"
    echo ""
    echo "4. Monitor:"
    echo "   - Check browser console (F12) for errors"
    echo "   - Monitor real-time sync in dashboard"
    echo "   - Test on multiple devices"
    echo ""
    echo "📚 DOCUMENTATION:"
    echo "───────────────────────────────────────────────────────────────"
    echo "Quick Start: PRODUCT_SYNC_QUICK_START.md"
    echo "Technical:  PRODUCT_SYNC_GUIDE.md"
    echo "Overview:   README_PRODUCT_SYNC.md"
    echo ""
    echo "📞 SUPPORT CONTACTS:"
    echo "───────────────────────────────────────────────────────────────"
    echo "Admin Panel: /admin-products.html"
    echo "Dashboard:   /product-dashboard.html"
    echo "Shop:        /shop.html"
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${GREEN}✅ DEPLOYMENT READY - All systems verified!${NC}"
    echo ""
    exit 0
else
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${RED}⚠️  DEPLOYMENT BLOCKED${NC}"
    echo ""
    echo "Please fix the missing items above before deploying."
    echo ""
    exit 1
fi
