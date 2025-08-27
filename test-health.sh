#!/bin/bash

echo "🏥 Testing Server Health"
echo "======================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo "🚀 Step 2: Starting server in background..."
node server.js &
SERVER_PID=$!

echo "⏳ Step 3: Waiting for server to start..."
sleep 5

echo "🔍 Step 4: Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == *"status"* ]] && [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    echo "✅ Health check passed!"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed!"
    echo "Response: $HEALTH_RESPONSE"
fi

echo "🔍 Step 5: Testing root endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:3001/ || echo "FAILED")

if [[ "$ROOT_RESPONSE" == *"message"* ]]; then
    echo "✅ Root endpoint working!"
    echo "Response: $ROOT_RESPONSE"
else
    echo "❌ Root endpoint failed!"
    echo "Response: $ROOT_RESPONSE"
fi

echo "🛑 Step 6: Stopping server..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "🎉 Health test completed!"