FROM node:18-alpine

RUN apk add --no-cache tzdata git

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

RUN npm install
RUN cd client && npm install

COPY . .

RUN if [ -d "react-build" ]; then \
      echo "Using pre-built React files"; \
      cp -r react-build client/build; \
    else \
      echo "No pre-built files found, will build during Docker build"; \
    fi

RUN mkdir -p client/build

ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false

RUN echo "=== Checking client directory structure ===" && \
    ls -la client/src/ && \
    echo "=== Checking client package.json ===" && \
    cat client/package.json

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

RUN ls -la client/build/ || echo "Build directory not found"

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

RUN mkdir -p bots logs

CMD ["./start.sh"]