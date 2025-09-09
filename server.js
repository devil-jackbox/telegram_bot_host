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
const connectDB = require('./src/database/connection');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: dbStatus
  });
});

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

let botManager;
try {
  const BotManager = require('./src/botManager');
  botManager = BotManager.getInstance(io);
  logger.info('BotManager initialized successfully');
} catch (error) {
  logger.error('Failed to initialize BotManager:', error);
  botManager = null;
}

try {
  app.use('/api/bots', require('./src/routes/bots'));
  app.use('/api/files', require('./src/routes/files'));
  app.use('/api/logs', require('./src/routes/logs'));
  logger.info('API routes loaded successfully');
} catch (error) {
  logger.error('Failed to load API routes:', error);
  app.use('/api/bots', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
  app.use('/api/files', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
  app.use('/api/logs', (req, res) => res.status(503).json({ error: 'API temporarily unavailable' }));
}

if (process.env.NODE_ENV === 'production') {
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
    
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
    logger.info('Static files configured for production from:', buildPath);
    logger.info('React app will be served for all routes');
  } else {
    logger.error('React build files not found in any location');
    logger.error('Checked paths:', buildPaths);
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }
}

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);

  socket.on('join-bot-room', (botId) => {
    socket.join(`bot-${botId}`);
    logger.info(`Client ${socket.id} joined bot room: ${botId}`);
  });

  socket.on('leave-bot-room', (botId) => {
    socket.leave(`bot-${botId}`);
    logger.info(`Client ${socket.id} left bot room: ${botId}`);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  try {
    if (botManager) {
      await botManager.stopAllBots();
    }
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  try {
    if (botManager) {
      await botManager.stopAllBots();
    }
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  }
  
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on ${HOST}:${PORT}`);
      logger.info(`📱 Platform is ready to host Telegram bots!`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

server.on('error', (error) => {
  logger.error('Server error:', error);
  process.exit(1);
});

module.exports = { app, server, botManager };