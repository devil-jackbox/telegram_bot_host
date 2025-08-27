#!/bin/bash

echo "🔧 Quick Fix for Build Issues"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Clearing existing installations..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

echo "📦 Step 2: Installing dependencies..."
npm install --legacy-peer-deps
cd client && npm install --legacy-peer-deps && cd ..

echo "🔨 Step 3: Building the application..."
npm run build

echo "✅ Step 4: Verifying build..."
node verify-build.js

echo ""
echo "🎉 Build fix completed!"
echo ""
echo "If you're still having issues:"
echo "1. Check the build logs in Railway dashboard"
echo "2. Read TROUBLESHOOTING.md for detailed solutions"
echo "3. Try alternative deployment methods in DEPLOYMENT.md"