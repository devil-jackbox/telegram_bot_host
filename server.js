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

// Simple root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Telegram Bot Platform API is running - UPDATED',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
});

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
  const buildPath = path.join(__dirname, 'client/build');
  const indexPath = path.join(buildPath, 'index.html');
  
  // Check if build files exist
  if (fs.existsSync(buildPath) && fs.existsSync(indexPath)) {
    app.use(express.static(buildPath));
    
    // Serve React app for all other routes
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
    logger.info('Static files configured for production');
  } else {
    logger.error('React build files not found. Expected:', buildPath);
    logger.error('Please ensure the React app was built successfully.');
    
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