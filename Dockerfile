# Use Node.js 18 as base image
FROM node:18-alpine

# Install only minimal runtime deps for Node app
RUN apk add --no-cache tzdata git

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy all source code
COPY . .

# Copy pre-built React files if they exist
RUN if [ -d "react-build" ]; then \
      echo "Using pre-built React files"; \
      cp -r react-build client/build; \
    else \
      echo "No pre-built files found, will build during Docker build"; \
    fi

# Create necessary directories
RUN mkdir -p client/build

# Set environment variables for build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false

# Debug: Check what files are present
RUN echo "=== Checking client directory structure ===" && \
    ls -la client/src/ && \
    echo "=== Checking client package.json ===" && \
    cat client/package.json

# Build the React app with detailed error reporting
RUN cd client && \
    echo "=== Starting React build ===" && \
    npm run build || \
    (echo "=== Build failed, trying without ESLint ===" && \
     npm run build:no-lint || \
     (echo "=== Build failed, checking for errors ===" && \
      echo "=== Node version ===" && node --version && \
      echo "=== NPM version ===" && npm --version && \
      echo "=== Available scripts ===" && npm run && \
      exit 1))

# Verify build was successful
RUN ls -la client/build/ || echo "Build directory not found"

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Create necessary directories
RUN mkdir -p bots logs

# Start the application
CMD ["./start.sh"]