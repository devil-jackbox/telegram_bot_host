#!/bin/bash

# Build script for Railway deployment

echo "🚀 Starting build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client && npm install && cd ..

# Build frontend
echo "🔨 Building frontend..."
cd client && npm run build && cd ..

echo "✅ Build completed successfully!"