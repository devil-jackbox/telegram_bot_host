#!/bin/bash

echo "🔧 Fixing Frontend Serving Issue"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install
cd client && npm install && cd ..

echo "🏗️ Step 2: Building React app..."
cd client
if npm run build; then
    echo "✅ React build successful!"
else
    echo "⚠️ Regular build failed, trying no-lint build..."
    if npm run build:no-lint; then
        echo "✅ No-lint build successful!"
    else
        echo "❌ All builds failed!"
        exit 1
    fi
fi
cd ..

echo "🔍 Step 3: Verifying build files..."
if [ -d "client/build" ] && [ -f "client/build/index.html" ]; then
    echo "✅ Build files found!"
    ls -la client/build/
else
    echo "❌ Build files missing!"
    exit 1
fi

echo "🚀 Step 4: Testing server startup..."
node server.js &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

echo "🔍 Step 5: Testing endpoints..."
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | head -c 100

echo ""
echo "Testing root endpoint..."
curl -s http://localhost:3001/ | head -c 200

echo ""
echo "🛑 Stopping test server..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "🎉 Frontend fix completed!"
echo "📝 Next steps:"
echo "1. Commit these changes"
echo "2. Push to GitHub"
echo "3. Redeploy on Railway"
echo "4. The frontend should now be accessible!"