const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

class BotManager {
  constructor(io = null) {
    this.io = io;
    this.bots = new Map();
    this.botProcesses = new Map();
    this.botLogs = new Map();
    this.botErrors = new Map();
    this.botsDir = path.join(__dirname, '../bots');
    this.startingBots = new Set();
    
    fs.ensureDirSync(this.botsDir);
    
    this.cleanupOrphanedProcesses().then(() => {
      this.loadExistingBots();
    }).catch(error => {
      logger.error('Error during startup cleanup:', error);
      this.loadExistingBots();
    });
  }

  static instance = null;
  
  static getInstance(io = null) {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager(io);
    }
    return BotManager.instance;
  }

  async loadExistingBots() {
    try {
      if (!await fs.pathExists(this.botsDir)) {
        await fs.ensureDir(this.botsDir);
        logger.info('Created bots directory');
        return;
      }

      const botDirs = await fs.readdir(this.botsDir);
      for (const botDir of botDirs) {
        try {
          const botPath = path.join(this.botsDir, botDir);
          const configPath = path.join(botPath, 'config.json');
          
          if (await fs.pathExists(configPath)) {
            const config = await fs.readJson(configPath);
            this.bots.set(botDir, config);
            this.botLogs.set(botDir, []);
            this.botErrors.set(botDir, []);
            
            if (config.autoStart && process.env.NODE_ENV !== 'production') {
              this.startBot(botDir);
            }
          }
        } catch (botError) {
          logger.error(`Error loading bot ${botDir}:`, botError);
        }
      }
      logger.info(`Loaded ${this.bots.size} existing bots`);
    } catch (error) {
      logger.error('Error loading existing bots:', error);
    }
  }

  async createBot(botData) {
    const botId = uuidv4();
    const botDir = path.join(this.botsDir, botId);
    
    try {
      await fs.ensureDir(botDir);
      
      const config = {
        id: botId,
        name: botData.name,
        token: botData.token,
        language: 'javascript',
        code: botData.code || '',
        autoStart: botData.autoStart || false,
        environmentVariables: botData.environmentVariables || [
          { key: 'BOT_TOKEN', value: botData.token, isSecret: true },
          { key: 'BOT_MODE', value: 'polling', isSecret: false },
          { key: 'PROTECT_CONTENT', value: 'false', isSecret: false }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await fs.writeJson(path.join(botDir, 'config.json'), config, { spaces: 2 });
      await this.createBotFile(botDir, config);
      
      this.botLogs.set(botId, []);
      this.botErrors.set(botId, []);
      this.bots.set(botId, config);
      
      logger.info(`Created bot: ${botId} (${config.name})`);
      
      return { success: true, bot: config };
    } catch (error) {
      logger.error(`Failed to create bot: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async createBotFile(botDir, config) {
    const fileName = 'bot.js';
    const filePath = path.join(botDir, fileName);
    
    let code = config.code;
    
    if (!code || code.trim() === '') {
      code = this.getBoilerplateCode(config.token);
    }
    
    await fs.writeFile(filePath, code);
    
    const packageJson = {
      name: `bot-${config.id}`,
      version: "1.0.0",
      main: fileName,
      dependencies: {
        "node-telegram-bot-api": "^0.64.0"
      }
    };
    await fs.writeJson(path.join(botDir, 'package.json'), packageJson, { spaces: 2 });
  }

  getBoilerplateCode(token) {
    return `const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const botMode = process.env.BOT_MODE || 'polling';

if (!token) {
  console.error('❌ BOT_TOKEN environment variable is required');
  process.exit(1);
}

let bot;
if (botMode === 'webhook') {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ WEBHOOK_URL environment variable is required for webhook mode');
    process.exit(1);
  }
  
  bot = new TelegramBot(token, { 
    webHook: { 
      port: process.env.PORT || 8443,
      host: '0.0.0.0'
    }
  });
  
  bot.setWebHook(webhookUrl);
  console.log('🌐 Webhook mode enabled:', webhookUrl);
} else {
  const protectContent = String(process.env.PROTECT_CONTENT || 'false').toLowerCase() === 'true';
  bot = new TelegramBot(token, { polling: true });
  if (protectContent) {
    const originalSendMessage = bot.sendMessage.bind(bot);
    bot.sendMessage = (chatId, text, options = {}) => {
      options = { ...options, protect_content: true };
      return originalSendMessage(chatId, text, options);
    };
  }
  console.log('📡 Polling mode enabled');
}

const processedMessages = new Set();
const messageQueue = [];
let isProcessingQueue = false;

async function processMessageQueue() {
  if (isProcessingQueue || messageQueue.length === 0 || botMode === 'webhook') return;
  
  isProcessingQueue = true;
  console.log(\`📨 Processing \${messageQueue.length} queued messages...\`);
  
  for (const message of messageQueue) {
    try {
      await handleMessage(message);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error processing queued message:', error);
    }
  }
  
  messageQueue.length = 0;
  isProcessingQueue = false;
  console.log('✅ Finished processing queued messages');
}

async function handleMessage(msg) {
  const messageId = msg.message_id;
  const chatId = msg.chat.id;
  const text = msg.text;
  const from = msg.from;
  
  if (botMode === 'polling' && processedMessages.has(messageId)) {
    console.log(\`⏭️ Skipping already processed message: \${messageId}\`);
    return;
  }
  
  if (botMode === 'polling') {
    processedMessages.add(messageId);
    
    if (processedMessages.size > 100) {
      const firstKey = processedMessages.values().next().value;
      processedMessages.delete(firstKey);
    }
  }
  
  console.log(\`📨 Received message from \${from.first_name} (\${from.id}): \${text}\`);
  
  if (text && text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    
    switch (command) {
      case '/start':
        await bot.sendMessage(chatId, \`Hello \${from.first_name}! 👋\\nI'm your Telegram bot.\\n\\nMode: \${botMode.toUpperCase()}\\n\\nCommands:\\n/help - Show this help\\n/status - Check bot status\\n/time - Current time\\n/mode - Show bot mode\`);
        break;
        
      case '/help':
        await bot.sendMessage(chatId, \`🤖 Bot Commands:\\n\\n/start - Start the bot\\n/help - Show this help\\n/status - Check bot status\\n/time - Current time\\n/mode - Show bot mode\\n\\nBot is running smoothly! ✅\`);
        break;
        
      case '/status':
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await bot.sendMessage(chatId, \`🟢 Bot Status: ONLINE\\n📡 Mode: \${botMode.toUpperCase()}\\n⏱️ Uptime: \${hours}h \${minutes}m \${seconds}s\\n💾 Memory: \${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\`);
        break;
        
      case '/time':
        const now = new Date();
        await bot.sendMessage(chatId, \`🕐 Current time: \${now.toLocaleString()}\`);
        break;
        
      case '/mode':
        const modeInfo = botMode === 'webhook' 
          ? '🌐 Webhook Mode: Telegram sends messages directly to your bot. No message queuing.'
          : '📡 Polling Mode: Bot continuously checks for new messages. May receive queued messages when restarted.';
        await bot.sendMessage(chatId, \`📡 Bot Mode: \${botMode.toUpperCase()}\\n\\n\${modeInfo}\`);
        break;
        
      default:
        await bot.sendMessage(chatId, \`❓ Unknown command: \${command}\\nUse /help to see available commands.\`);
    }
  } else if (text) {
    await bot.sendMessage(chatId, \`You said: "\${text}"\\n\\nI'm an echo bot! 🗣️\\nMode: \${botMode.toUpperCase()}\`);
  }
}

bot.on('message', async (msg) => {
  try {
    if (botMode === 'polling' && isProcessingQueue) {
      messageQueue.push(msg);
      return;
    }
    
    await handleMessage(msg);
  } catch (error) {
    console.error('❌ Error handling message:', error);
    try {
      await bot.sendMessage(msg.chat.id, '❌ Sorry, something went wrong. Please try again.');
    } catch (sendError) {
      console.error('❌ Error sending error message:', sendError);
    }
  }
});

if (botMode === 'polling') {
  bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
  });

  bot.on('polling_start', () => {
    console.log('🤖 Bot started polling for messages...');
    setTimeout(processMessageQueue, 2000);
  });

  bot.on('polling_stop', () => {
    console.log('🛑 Bot stopped polling for messages.');
  });
}

if (botMode === 'webhook') {
  bot.on('webhook_error', (error) => {
    console.error('❌ Webhook error:', error);
  });
}

process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  if (botMode === 'polling') {
    bot.stopPolling();
  } else {
    bot.deleteWebHook();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down bot...');
  if (botMode === 'polling') {
    bot.stopPolling();
  } else {
    bot.deleteWebHook();
  }
  process.exit(0);
});

console.log('🚀 Bot is starting...');
console.log(\`📡 Mode: \${botMode.toUpperCase()}\`);
console.log('📝 Use /start to begin chatting!');`;
  }

  async ensureDependencies(bot) {
    const botDir = path.join(this.botsDir, bot.id);
    try {
      const nodeModulesPath = path.join(botDir, 'node_modules');
      const hasNodeModules = await fs.pathExists(nodeModulesPath);
      const pkgJsonPath = path.join(botDir, 'package.json');
      const hasPkg = await fs.pathExists(pkgJsonPath);
      
      if (hasPkg && !hasNodeModules) {
        this.addLog(bot.id, 'info', 'Installing Node.js dependencies...');
        await new Promise((resolve, reject) => {
          const install = spawn('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { 
            cwd: botDir, 
            env: { ...(process.env||{}) } 
          });
          install.stdout.on('data', d => this.addLog(bot.id, 'info', d.toString()));
          install.stderr.on('data', d => this.addLog(bot.id, 'info', d.toString()));
          install.on('close', code => code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`)));
          install.on('error', err => reject(err));
        });
        this.addLog(bot.id, 'info', 'Node.js dependencies installed');
      }
    } catch (depErr) {
      this.addError(bot.id, `Dependency installation failed: ${depErr.message}`);
      throw depErr;
    }
  }

  async startBot(botId) {
    if (this.botProcesses.has(botId)) {
      logger.warn(`Bot ${botId} is already running`);
      return { success: false, error: 'Bot is already running' };
    }

    if (this.startingBots.has(botId)) {
      logger.warn(`Bot ${botId} is already starting`);
      return { success: false, error: 'Bot is already starting' };
    }

    const bot = this.bots.get(botId);
    if (!bot) {
      return { success: false, error: 'Bot not found' };
    }

    this.startingBots.add(botId);

    try {
      const botDir = path.join(this.botsDir, botId);
      
      if (!await fs.pathExists(botDir)) {
        throw new Error(`Bot directory does not exist: ${botDir}`);
      }
      
      const botFile = 'bot.js';
      const botFilePath = path.join(botDir, botFile);
      
      if (!await fs.pathExists(botFilePath)) {
        throw new Error(`Bot file does not exist: ${botFilePath}`);
      }
      
      const pidFile = path.join(botDir, 'bot.pid');
      if (await fs.pathExists(pidFile)) {
        try {
          const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
          try {
            process.kill(-pid, 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              process.kill(-pid, 'SIGKILL');
            } catch {}
          } catch (killError) {
            logger.warn(`Could not kill existing process ${pid}: ${killError.message}`);
          }
          await fs.remove(pidFile);
        } catch (fileError) {
          logger.warn(`Error reading PID file: ${fileError.message}`);
          try {
            await fs.remove(pidFile);
          } catch {}
        }
      }
      
      const env = {
        ...(process.env || {}),
        PATH: (process.env && process.env.PATH) || '/usr/local/bin:/usr/bin:/bin'
      };
      
      if (bot.environmentVariables && Array.isArray(bot.environmentVariables)) {
        bot.environmentVariables.forEach(envVar => {
          if (envVar.key && envVar.value !== undefined) {
            env[envVar.key] = envVar.value;
          }
        });
      } else {
        env.BOT_TOKEN = bot.token;
        env.NODE_ENV = 'production';
      }
      
      if (!env.PORT) env.PORT = '3000';
      if (!env.LOG_LEVEL) env.LOG_LEVEL = 'info';
      if (!env.DEBUG) env.DEBUG = 'false';

      await this.ensureDependencies(bot);
      
      const childProcess = spawn('node', [botFile], { cwd: botDir, env, detached: true });

      this.botProcesses.set(botId, childProcess);
      
      try {
        await fs.writeFile(path.join(botDir, 'bot.pid'), String(childProcess.pid));
      } catch {}
      
      childProcess.stdout.on('data', (data) => {
        const log = data.toString().trim();
        this.addLog(botId, 'info', log);
      });

      childProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        this.addError(botId, error);
      });

      childProcess.on('close', (code) => {
        this.botProcesses.delete(botId);
        this.startingBots.delete(botId);
        try { 
          fs.remove(path.join(this.botsDir, botId, 'bot.pid')); 
        } catch {}
        this.addLog(botId, 'info', `Bot process exited with code ${code}`);
        if (this.io) {
          this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
        }
      });

      childProcess.on('error', (error) => {
        this.addError(botId, `Process error: ${error.message}`);
        this.botProcesses.delete(botId);
        this.startingBots.delete(botId);
      });

      this.addLog(botId, 'info', 'Bot started successfully');
      if (this.io) {
        this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'running' });
      }
      
      return { success: true };
    } catch (error) {
      logger.error(`Error starting bot ${botId}:`, error);
      this.addError(botId, `Failed to start bot: ${error.message}`);
      this.startingBots.delete(botId);
      return { success: false, error: error.message };
    }
  }

  async stopBot(botId) {
    const childProcess = this.botProcesses.get(botId);
    if (!childProcess) {
      const botDir = path.join(this.botsDir, botId);
      const pidFile = path.join(botDir, 'bot.pid');
      
      try {
        if (await fs.pathExists(pidFile)) {
          const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
          try {
            process.kill(-pid, 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              process.kill(-pid, 'SIGKILL');
            } catch {}
            await fs.remove(pidFile);
          } catch (killError) {
            logger.warn(`Could not kill process ${pid}: ${killError.message}`);
          }
        }
      } catch (fileError) {
        logger.warn(`Error reading PID file for bot ${botId}: ${fileError.message}`);
      }
      
      return { success: true };
    }

    try {
      try {
        process.kill(-childProcess.pid, 'SIGTERM');
      } catch (groupError) {
        try {
          childProcess.kill('SIGTERM');
        } catch (directError) {
          logger.warn(`Could not kill process directly: ${directError.message}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (this.botProcesses.has(botId)) {
        try {
          process.kill(-childProcess.pid, 'SIGKILL');
        } catch (groupError) {
          try {
            childProcess.kill('SIGKILL');
          } catch (directError) {
            logger.warn(`Could not SIGKILL process directly: ${directError.message}`);
          }
        }
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const botDir = path.join(this.botsDir, botId);
      const pidFile = path.join(botDir, 'bot.pid');
      try {
        await fs.remove(pidFile);
      } catch (fileError) {
        logger.warn(`Could not remove PID file: ${fileError.message}`);
      }

      this.botProcesses.delete(botId);
      this.startingBots.delete(botId);
      
      return { success: true };
    } catch (error) {
      logger.error(`Error stopping bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async updateBot(botId, updates) {
    const bot = this.bots.get(botId);
    if (!bot) {
      return { success: false, error: 'Bot not found' };
    }

    try {
      if (this.botProcesses.has(botId)) {
        await this.stopBot(botId);
      }

      Object.assign(bot, updates, { updatedAt: new Date().toISOString() });
      
      if (updates.environmentVariables && Array.isArray(updates.environmentVariables)) {
        bot.environmentVariables = updates.environmentVariables;
      }
      
      const botDir = path.join(this.botsDir, botId);
      await fs.writeJson(path.join(botDir, 'config.json'), bot, { spaces: 2 });
      
      await this.createBotFile(botDir, bot);
      
      this.bots.set(botId, bot);
      
      if (bot.autoStart && updates.autoStart !== false) {
        this.startBot(botId);
      }
      
      return { success: true, bot };
    } catch (error) {
      logger.error(`Error updating bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async deleteBot(botId) {
    try {
      if (this.botProcesses.has(botId)) {
        await this.stopBot(botId);
      }

      const botDir = path.join(this.botsDir, botId);
      await fs.remove(botDir);
      
      this.bots.delete(botId);
      this.botProcesses.delete(botId);
      this.botLogs.delete(botId);
      this.botErrors.delete(botId);
      this.startingBots.delete(botId);
      
      logger.info(`Deleted bot: ${botId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  addLog(botId, level, message) {
    const logs = this.botLogs.get(botId) || [];
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    logs.push(logEntry);
    
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }
    
    this.botLogs.set(botId, logs);
    if (this.io) {
      this.io.to(`bot-${botId}`).emit('bot-log', { botId, log: logEntry });
    }
  }

  addError(botId, error) {
    const errors = this.botErrors.get(botId) || [];
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error
    };
    
    errors.push(errorEntry);
    
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    this.botErrors.set(botId, errors);
    if (this.io) {
      this.io.to(`bot-${botId}`).emit('bot-error', { botId, error: errorEntry });
    }
  }

  getBot(botId) {
    return this.bots.get(botId);
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  getBotLogs(botId) {
    return this.botLogs.get(botId) || [];
  }

  getBotErrors(botId) {
    return this.botErrors.get(botId) || [];
  }

  getBotStatus(botId) {
    return {
      running: this.botProcesses.has(botId),
      logs: this.getBotLogs(botId),
      errors: this.getBotErrors(botId)
    };
  }

  async stopAllBots() {
    logger.info('Stopping all bots...');
    const botIds = Array.from(this.botProcesses.keys());
    
    for (const botId of botIds) {
      try {
        await this.stopBot(botId);
      } catch (error) {
        logger.error(`Error stopping bot ${botId}:`, error);
      }
    }
    
    logger.info('All bots stopped');
  }

  async cleanupOrphanedProcesses() {
    logger.info('Checking for orphaned bot processes...');
    
    try {
      const botDirs = await fs.readdir(this.botsDir);
      
      for (const botDir of botDirs) {
        const botPath = path.join(this.botsDir, botDir);
        const pidFile = path.join(botPath, 'bot.pid');
        
        if (await fs.pathExists(pidFile)) {
          try {
            const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
            logger.info(`Found orphaned PID file for bot ${botDir}, PID: ${pid}`);
            
            try {
              process.kill(pid, 0);
              logger.warn(`Process ${pid} is still running, killing it...`);
              
              try {
                process.kill(-pid, 'SIGTERM');
                await new Promise(resolve => setTimeout(resolve, 2000));
                process.kill(-pid, 'SIGKILL');
              } catch {}
              
            } catch (checkError) {
              logger.info(`Process ${pid} is not running, removing PID file`);
            }
            
            await fs.remove(pidFile);
            logger.info(`Cleaned up orphaned process for bot ${botDir}`);
            
          } catch (error) {
            logger.warn(`Error cleaning up orphaned process for bot ${botDir}:`, error);
            try {
              await fs.remove(pidFile);
            } catch {}
          }
        }
      }
    } catch (error) {
      logger.error('Error during orphaned process cleanup:', error);
    }
  }
}

module.exports = BotManager;