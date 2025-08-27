#!/bin/bash

echo "🐳 Fixing Docker Build Issues"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Testing local build first..."
cd client
npm install
npm run build
cd ..

if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed - fixing dependencies..."
    cd client
    npm install --legacy-peer-deps
    npm run build
    cd ..
fi

echo "🐳 Step 2: Testing Docker build..."
echo "Using Dockerfile.simple for testing..."

# Test with simple Dockerfile
docker build -f Dockerfile.simple -t telegram-bot-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful with simple Dockerfile"
    echo "You can now use Dockerfile.simple for deployment"
else
    echo "❌ Docker build failed - trying with production Dockerfile..."
    docker build -f Dockerfile.production -t telegram-bot-test .
fi

echo ""
echo "🎉 Docker build fix completed!"
echo ""
echo "Next steps:"
echo "1. Use Dockerfile.simple for simple deployments"
echo "2. Use Dockerfile.production for optimized deployments"
echo "3. Check the build logs for specific errors"