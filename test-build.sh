#!/bin/bash

set -e

echo "🧪 Testing React Build Process"
echo "=============================="

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

echo "🔍 Step 3: Checking client directory structure..."
echo "Files in client/src:"
ls -la src/

echo "🔍 Step 4: Checking for missing imports..."
echo "Checking App.js imports..."
grep -n "import" src/App.js || echo "No imports found in App.js"

echo "🔍 Step 5: Checking package.json scripts..."
echo "Available scripts:"
npm run

echo "🔨 Step 6: Attempting build with verbose output..."
npm run build --verbose

echo "✅ Step 7: Checking build output..."
if [ -d "build" ]; then
    echo "✅ Build directory created successfully"
    ls -la build/
else
    echo "❌ Build directory not found"
    exit 1
fi

echo "🎉 Build test completed successfully!"