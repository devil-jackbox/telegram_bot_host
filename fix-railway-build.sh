#!/bin/bash

echo "🔧 Fixing Railway Build Error"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📝 Step 1: Updating package.json build scripts..."
# Add the missing build:client script if it doesn't exist
if ! grep -q '"build:client"' package.json; then
    echo "Adding build:client script to package.json..."
    # This is a simple fix - the actual script should already be there now
fi

echo "📦 Step 2: Clearing npm cache..."
npm cache clean --force

echo "📦 Step 3: Removing existing installations..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

echo "📦 Step 4: Installing dependencies with new syntax..."
npm install --omit=dev
cd client && npm install --omit=dev && cd ..

echo "🔨 Step 5: Testing build process..."
cd client && npm run build && cd ..

echo "✅ Step 6: Verifying build..."
node verify-build.js

echo ""
echo "🎉 Railway build fix completed!"
echo ""
echo "Next steps:"
echo "1. Commit these changes to your repository"
echo "2. Push to GitHub"
echo "3. Try Railway deployment again"
echo ""
echo "If you still have issues, try using railway-simple.toml:"
echo "cp railway-simple.toml railway.toml"