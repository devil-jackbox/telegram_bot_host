const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('./src/utils/logger');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));
app.use(compression());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (must be first)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Debug endpoint to check build files
app.get('/debug', (req, res) => {
  const buildPaths = [
    path.join(__dirname, 'client/build'),
    path.join(__dirname, 'react-build'),
    path.join(__dirname, 'build')
  ];
  
  const debugInfo = {
    environment: process.env.NODE_ENV || 'development',
    buildPaths: buildPaths.map(buildPath => ({
      path: buildPath,
      exists: fs.existsSync(buildPath),
      hasIndex: fs.existsSync(path.join(buildPath, 'index.html'))
    })),
    currentDir: __dirname,
    files: fs.readdirSync(__dirname)
  };
  
  res.json(debugInfo);
});

// Simple root endpoint for testing (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Telegram Bot Platform API is running - DOCKER DEPLOYMENT',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.3',
      build: 'Docker deployment with pre-built React files',
      deployment: 'Docker'
    });
  });
}

// Initialize bot manager with error handling
let botManager;
try {
  const BotManager = require('./src/botManager');
  botManager = new BotManager(io);
  logger.info('BotManager initialized successfully');
} catch (error) {
  logger.error('Failed to initialize BotManager:', error);
  // Continue without bot manager for now
  botManager = null;
}

// API Routes with error handling
try {
  app.use('/api/bots', require('./src/routes/bots'));
  app.use('/api/files', require('./src/routes/files'));
  app.use('/api/logs', require('./src/routes/logs'));
  logger.info('API routes loaded successfully');
} catch (error) {
  logger.error('Failed to load API routes:', error);
  // Add fallback routes
  app.use('/api/bots', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
  app.use('/api/files', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
  app.use('/api/logs', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
}

// Static files (only in production)
if (process.env.NODE_ENV === 'production') {
  // Try multiple possible build locations
  const buildPaths = [
    path.join(__dirname, 'client/build'),
    path.join(__dirname, 'react-build'),
    path.join(__dirname, 'build')
  ];
  
  let buildPath = null;
  let indexPath = null;
  
  for (const buildPathOption of buildPaths) {
    const indexFile = path.join(buildPathOption, 'index.html');
    if (fs.existsSync(buildPathOption) && fs.existsSync(indexFile)) {
      buildPath = buildPathOption;
      indexPath = indexFile;
      break;
    }
  }
  
  if (buildPath && indexPath) {
    app.use(express.static(buildPath));
    
    // Serve React app for all other routes
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
    logger.info('Static files configured for production from:', buildPath);
    logger.info('React app will be served for all routes');
  } else {
    logger.error('React build files not found in any location');
    logger.error('Checked paths:', buildPaths);
    
    // Fallback: serve a simple HTML page
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-bot-room', (botId) => {
    socket.join(`bot-${botId}`);
    logger.info(`Client ${socket.id} joined bot room: ${botId}`);
  });

  socket.on('leave-bot-room', (botId) => {
    socket.leave(`bot-${botId}`);
    logger.info(`Client ${socket.id} left bot room: ${botId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

// Start server with error handling
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (botManager) {
    botManager.stopAllBots();
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (botManager) {
    botManager.stopAllBots();
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, botManager };