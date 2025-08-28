#!/bin/sh

echo "🚀 Starting Telegram Bot Platform"
echo "================================"

# Set environment variables
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3001}"
export HOST="${HOST:-0.0.0.0}"

echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Host: $HOST"

# Create necessary directories
mkdir -p bots logs

# Check if client build exists
if [ ! -d "client/build" ]; then
    echo "⚠️  Client build not found, building..."
    cd client && npm run build && cd ..
fi

# Start the server
echo "Starting server..."
exec node server.js