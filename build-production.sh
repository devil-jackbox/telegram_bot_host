#!/bin/bash

set -e  # Exit on any error

echo "🚀 Production Build Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Installing backend dependencies..."
npm install

echo "📦 Step 2: Installing frontend dependencies..."
cd client
npm install
cd ..

echo "🔨 Step 3: Building frontend..."
cd client
npm run build
cd ..

echo "✅ Step 4: Verifying build..."
if [ -d "client/build" ]; then
    echo "✅ Frontend build directory created successfully"
    ls -la client/build/
else
    echo "❌ Frontend build directory not found"
    exit 1
fi

echo "✅ Step 5: Final verification..."
node verify-build.js

echo ""
echo "🎉 Production build completed successfully!"
echo "The application is ready for deployment."