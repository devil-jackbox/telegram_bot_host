#!/bin/bash

echo "🏗️ Building React App"
echo "===================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Installing client dependencies..."
cd client
npm install

echo "🏗️ Step 2: Building React app..."
if npm run build; then
    echo "✅ React build successful!"
elif npm run build:no-lint; then
    echo "✅ React build successful (no-lint mode)!"
else
    echo "❌ React build failed!"
    echo "=== Debugging information ==="
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Available scripts:"
    npm run
    exit 1
fi

echo "🔍 Step 3: Verifying build files..."
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build files found!"
    echo "Build directory contents:"
    ls -la build/
    echo ""
    echo "✅ React build verification complete!"
else
    echo "❌ Build files missing!"
    exit 1
fi

cd ..