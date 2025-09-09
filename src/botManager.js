const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const BotService = require('./services/BotService');

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
      const bots = await BotService.getAllBots();
      
      for (const bot of bots) {
        this.bots.set(bot.id, bot);
        
        if (bot.autoStart && process.env.NODE_ENV !== 'production') {
          setTimeout(() => {
            this.startBot(bot.id);
          }, 2000);
        }
      }
      
      logger.info(`Loaded ${bots.length} bots from database`);
    } catch (error) {
      logger.error('Error loading bots from database:', error);
    }
  }

  async createBot(config) {
    try {
      const bot = await BotService.createBot(config);
      this.bots.set(bot.id, bot);
      
      await this.createBotFile(bot);
      await this.ensureDependencies(bot);
      
      return bot;
    } catch (error) {
      logger.error('Error creating bot:', error);
      throw error;
    }
  }

  async createBotFile(bot) {
    try {
      const botDir = path.join(this.botsDir, bot.id);
      await fs.ensureDir(botDir);
      
      const fileName = 'bot.js';
      const filePath = path.join(botDir, fileName);
      
      const code = await BotService.getBotCode(bot.id);
      const finalCode = code || this.getBoilerplateCode(bot.token);
      
      await fs.writeFile(filePath, finalCode);
      
      const packageJson = {
        name: `bot-${bot.id}`,
        version: "1.0.0",
        main: fileName,
        dependencies: {
          "node-telegram-bot-api": "^0.64.0"
        }
      };
      
      await fs.writeFile(path.join(botDir, 'package.json'), JSON.stringify(packageJson, null, 2));
      
      logger.info(`Created bot file for ${bot.id}`);
    } catch (error) {
      logger.error('Error creating bot file:', error);
      throw error;
    }
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
  // Initialize without polling, ensure webhook is cleared, then start polling to avoid 409 conflicts
  bot = new TelegramBot(token, { polling: false });
  (async () => {
    try {
      await bot.deleteWebHook({ drop_pending_updates: true });
    } catch (e) {
      console.error('❌ Failed clearing webhook (safe to ignore if none set):', e.message || e);
    }
    try {
      await bot.startPolling({ params: { timeout: 10 } });
      console.log('📡 Polling mode enabled');
    } catch (e) {
      console.error('❌ Failed to start polling:', e.message || e);
    }
  })();
  if (protectContent) {
    const originalSendMessage = bot.sendMessage.bind(bot);
    bot.sendMessage = (chatId, text, options = {}) => {
      options = { ...options, protect_content: true };
      return originalSendMessage(chatId, text, options);
    };
  }
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
  bot.on('polling_error', async (error) => {
    console.error('❌ Polling error:', error);
    try {
      const isConflict = (error && (error.statusCode === 409 || error.code === 'ETELEGRAM' || String(error).includes('409')));
      if (isConflict) {
        console.log('🔄 Recovering from 409 conflict: clearing webhook and restarting polling...');
        try {
          await bot.deleteWebHook({ drop_pending_updates: true });
        } catch {}
        try {
          await bot.stopPolling();
        } catch {}
        await new Promise(r => setTimeout(r, 1500));
        try {
          await bot.startPolling({ params: { timeout: 10 } });
          console.log('✅ Polling restarted after conflict');
        } catch (e) {
          console.error('❌ Failed to restart polling:', e);
        }
      }
    } catch (e) {
      console.error('❌ Recovery handler error:', e);
    }
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
            env: { 
              ...process.env,
              PATH: (process.env && process.env.PATH) || '/usr/local/bin:/usr/bin:/bin'
            }
          });
          
          install.stdout.on('data', (data) => {
            this.addLog(bot.id, 'info', data.toString());
          });
          
          install.stderr.on('data', (data) => {
            this.addLog(bot.id, 'error', data.toString());
          });
          
          install.on('close', code => code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`)));
        });
      }
    } catch (error) {
      this.addError(bot.id, `Dependency installation failed: ${error.message}`);
    }
  }

  async startBot(botId) {
    try {
      if (this.startingBots.has(botId)) {
        logger.warn(`Bot ${botId} is already starting`);
        return;
      }

      this.startingBots.add(botId);
      // Ensure bot is loaded from DB if not present in memory yet
      let bot = this.bots.get(botId);
      if (!bot) {
        bot = await BotService.getBot(botId);
        if (bot) {
          this.bots.set(botId, bot);
          // Ensure bot files and dependencies exist before starting
          await this.createBotFile(bot).catch(() => {});
          await this.ensureDependencies(bot).catch(() => {});
        } else {
          throw new Error(`Bot ${botId} not found`);
        }
      }

      if (this.botProcesses.has(botId)) {
        throw new Error(`Bot ${botId} is already running`);
      }

      const botDir = path.join(this.botsDir, botId);
      const botFilePath = path.join(botDir, 'bot.js');
      
      // Create bot directory and file if missing
      if (!await fs.pathExists(botDir)) {
        await fs.ensureDir(botDir);
      }
      if (!await fs.pathExists(botFilePath)) {
        await this.createBotFile(bot);
      }

      const envVars = await BotService.getBotEnvironmentVariables(botId);
      const env = {
        ...process.env,
        BOT_TOKEN: bot.token,
        BOT_MODE: 'polling',
        NODE_ENV: process.env.NODE_ENV || 'production'
      };

      envVars.forEach(envVar => {
        env[envVar.key] = envVar.value;
      });

      const child = spawn('node', [botFilePath], {
        cwd: botDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.botProcesses.set(botId, child);
      this.botLogs.set(botId, []);
      this.botErrors.set(botId, []);

      child.stdout.on('data', (data) => {
        const message = data.toString();
        this.addLog(botId, 'info', message);
      });

      child.stderr.on('data', (data) => {
        const message = data.toString();
        this.addError(botId, message);
      });

      child.on('close', (code) => {
        this.botProcesses.delete(botId);
        this.startingBots.delete(botId);
        
        if (code !== 0) {
          this.addError(botId, `Process exited with code ${code}`);
        }
        
        this.addLog(botId, 'info', `Bot process ended with code ${code}`);
        
        if (this.io) {
          this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
        }
      });

      child.on('error', (error) => {
        this.addError(botId, `Process error: ${error.message}`);
        this.botProcesses.delete(botId);
        this.startingBots.delete(botId);
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (this.botProcesses.has(botId)) {
        this.addLog(botId, 'info', 'Bot started successfully');
        if (this.io) {
          this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'running' });
        }
      } else {
        throw new Error('Bot failed to start');
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
    } catch (error) {
      this.addError(botId, `Failed to start bot: ${error.message}`);
      this.startingBots.delete(botId);
      throw error;
    }
  }

  async stopBot(botId) {
    try {
      const process = this.botProcesses.get(botId);
      if (!process) {
        logger.warn(`Bot ${botId} is not running`);
        return;
      }

      const pid = process.pid;
      if (pid) {
        try {
          process.kill(-pid, 'SIGTERM');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            process.kill(-pid, 'SIGKILL');
          } catch {}
        } catch (error) {
          logger.error(`Error killing process ${pid}:`, error);
        }
      }

      this.botProcesses.delete(botId);
      this.addLog(botId, 'info', 'Bot stopped successfully');
      
      if (this.io) {
        this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
      }
    } catch (error) {
      this.addError(botId, error);
      throw error;
    }
  }

  async updateBot(botId, updateData) {
    try {
      const bot = await BotService.updateBot(botId, updateData);
      if (bot) {
        this.bots.set(botId, bot);
      }
      return bot;
    } catch (error) {
      logger.error('Error updating bot:', error);
      throw error;
    }
  }

  async deleteBot(botId) {
    try {
      await this.stopBot(botId);
      await BotService.deleteBot(botId);
      this.bots.delete(botId);
      
      const botDir = path.join(this.botsDir, botId);
      if (await fs.pathExists(botDir)) {
        await fs.remove(botDir);
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting bot:', error);
      throw error;
    }
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  getBot(botId) {
    return this.bots.get(botId);
  }

  addLog(botId, level, message) {
    try {
      const logs = this.botLogs.get(botId) || [];
      logs.push({
        level,
        message: message.trim(),
        timestamp: new Date()
      });
      
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }
      
      this.botLogs.set(botId, logs);
      BotService.addBotLog(botId, level, message.trim());
      
      if (this.io) {
        this.io.to(`bot-${botId}`).emit('bot-log', { botId, log: { level, message: message.trim(), timestamp: new Date() } });
      }
    } catch (error) {
      logger.error('Error adding log:', error);
    }
  }

  addError(botId, error) {
    try {
      const errors = this.botErrors.get(botId) || [];
      errors.push({
        error: error.toString(),
        timestamp: new Date()
      });
      
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      this.botErrors.set(botId, errors);
      BotService.addBotError(botId, error.toString());
      
      if (this.io) {
        this.io.to(`bot-${botId}`).emit('bot-error', { botId, error: error.toString() });
      }
    } catch (err) {
      logger.error('Error adding error:', err);
    }
  }

  getBotLogs(botId) {
    return this.botLogs.get(botId) || [];
  }

  getBotErrors(botId) {
    return this.botErrors.get(botId) || [];
  }

  async cleanupOrphanedProcesses() {
    try {
      const pidFiles = await fs.readdir(this.botsDir).catch(() => []);
      
      for (const pidFile of pidFiles) {
        if (pidFile.endsWith('.pid')) {
          const pidPath = path.join(this.botsDir, pidFile);
          const pid = parseInt(await fs.readFile(pidPath, 'utf8'));
          
          try {
            process.kill(pid, 0);
          } catch (error) {
            await fs.remove(pidPath);
            logger.info(`Cleaned up orphaned PID file: ${pidFile}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning up orphaned processes:', error);
    }
  }
}

module.exports = BotManager;