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
    
    // Ensure bots directory exists
    fs.ensureDirSync(this.botsDir);
    
    // Clean up orphaned processes on startup
    this.cleanupOrphanedProcesses().then(() => {
      // Load existing bots after cleanup
      this.loadExistingBots();
    }).catch(error => {
      logger.error('Error during startup cleanup:', error);
      // Still load existing bots even if cleanup fails
      this.loadExistingBots();
    });
  }

  // Singleton instance
  static instance = null;
  
  static getInstance(io = null) {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager(io);
    }
    return BotManager.instance;
  }

  async loadExistingBots() {
    try {
      // Check if bots directory exists, create if not
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
            
            // Don't auto-start bots in production to avoid issues
            if (config.autoStart && process.env.NODE_ENV !== 'production') {
              this.startBot(botDir);
            }
          }
        } catch (botError) {
          logger.error(`Error loading bot ${botDir}:`, botError);
          // Continue loading other bots
        }
      }
      logger.info(`Loaded ${this.bots.size} existing bots`);
    } catch (error) {
      logger.error('Error loading existing bots:', error);
      // Don't throw error, just log it
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
        language: botData.language,
        code: botData.code,
        autoStart: botData.autoStart || false,
        environmentVariables: botData.environmentVariables || [
          { key: 'BOT_TOKEN', value: botData.token, isSecret: true },
          { key: 'NODE_ENV', value: 'production', isSecret: false }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save bot configuration
      await fs.writeJson(path.join(botDir, 'config.json'), config, { spaces: 2 });
      
      // Create bot file based on language
      await this.createBotFile(botDir, config);
      
      // Initialize logs and errors
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
    const fileExtension = this.getFileExtension(config.language);
    const fileName = `bot.${fileExtension}`;
    const filePath = path.join(botDir, fileName);
    
    let code = config.code;
    
    // Add language-specific boilerplate if code is empty
    if (!code || code.trim() === '') {
      code = this.getBoilerplateCode(config.language, config.token);
    }
    
    await fs.writeFile(filePath, code);
    
    // Create package.json for Node.js bots
    if (config.language === 'javascript' || config.language === 'typescript') {
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
    
    // Create requirements.txt for Python bots
    if (config.language === 'python') {
      const requirements = [
        "python-telegram-bot==20.6",
        "python-dotenv==1.0.0"
      ];
      await fs.writeFile(path.join(botDir, 'requirements.txt'), requirements.join('\n'));
    }
  }

  getFileExtension(language) {
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'php': 'php',
      'ruby': 'rb',
      'go': 'go'
    };
    return extensions[language] || 'js';
  }

  getBoilerplateCode(language, token) {
    const boilerplates = {
      javascript: `const TelegramBot = require('node-telegram-bot-api');

// Get bot token and mode from environment variables
const token = process.env.BOT_TOKEN;
const botMode = process.env.BOT_MODE || 'polling';

if (!token) {
  console.error('❌ BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Bot configuration based on mode
let bot;
if (botMode === 'webhook') {
  // Webhook mode - requires HTTPS endpoint
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
  
  // Set webhook URL
  bot.setWebHook(webhookUrl);
  console.log('🌐 Webhook mode enabled:', webhookUrl);
} else {
  // Polling mode (default)
  bot = new TelegramBot(token, { polling: true });
  console.log('📡 Polling mode enabled');
}

// Message deduplication to prevent flooding on restart
const processedMessages = new Set();
const messageQueue = [];
let isProcessingQueue = false;

// Process queued messages with rate limiting (polling mode only)
async function processMessageQueue() {
  if (isProcessingQueue || messageQueue.length === 0 || botMode === 'webhook') return;
  
  isProcessingQueue = true;
  console.log(\`📨 Processing \${messageQueue.length} queued messages...\`);
  
  for (const message of messageQueue) {
    try {
      await handleMessage(message);
      // Rate limiting: wait 100ms between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error processing queued message:', error);
    }
  }
  
  messageQueue.length = 0; // Clear queue
  isProcessingQueue = false;
  console.log('✅ Finished processing queued messages');
}

// Handle incoming messages
async function handleMessage(msg) {
  const messageId = msg.message_id;
  const chatId = msg.chat.id;
  const text = msg.text;
  const from = msg.from;
  
  // Skip if message already processed (polling mode only)
  if (botMode === 'polling' && processedMessages.has(messageId)) {
    console.log(\`⏭️ Skipping already processed message: \${messageId}\`);
    return;
  }
  
  // Mark message as processed (polling mode only)
  if (botMode === 'polling') {
    processedMessages.add(messageId);
    
    // Keep only last 1000 processed messages to prevent memory leaks
    if (processedMessages.size > 1000) {
      const firstKey = processedMessages.values().next().value;
      processedMessages.delete(firstKey);
    }
  }
  
  console.log(\`📨 Received message from \${from.first_name} (\${from.id}): \${text}\`);
  
  // Handle commands
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
    // Echo non-command messages
    await bot.sendMessage(chatId, \`You said: "\${text}"\\n\\nI'm an echo bot! 🗣️\\nMode: \${botMode.toUpperCase()}\`);
  }
}

// Handle incoming messages
bot.on('message', async (msg) => {
  try {
    // If we're processing the queue (polling mode only), add to queue instead
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

// Handle polling errors (polling mode only)
if (botMode === 'polling') {
  bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
  });

  // Handle bot start (polling mode only)
  bot.on('polling_start', () => {
    console.log('🤖 Bot started polling for messages...');
    // Process any queued messages after a short delay
    setTimeout(processMessageQueue, 2000);
  });

  // Handle bot stop (polling mode only)
  bot.on('polling_stop', () => {
    console.log('🛑 Bot stopped polling for messages.');
  });
}

// Handle webhook errors (webhook mode only)
if (botMode === 'webhook') {
  bot.on('webhook_error', (error) => {
    console.error('❌ Webhook error:', error);
  });
}

// Graceful shutdown
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
console.log('📝 Use /start to begin chatting!');`,

      python: `import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Get the logger for the library
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    await update.message.reply_text('Hello! I am your Telegram bot.')

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Echo the user message."""
    await update.message.reply_text(update.message.text)

def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token
    application = Application.builder().token('${token}').build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))

    # on non command i.e message - echo the message on Telegram
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    # Run the bot until the user sends Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()`,

      php: `<?php
require_once 'vendor/autoload.php';

use TelegramBot\Api\BotApi;
use TelegramBot\Api\Types\Update;

$bot = new BotApi('${token}');

try {
    $updates = $bot->getUpdates();
    
    foreach ($updates as $update) {
        if ($update->getMessage()) {
            $message = $update->getMessage();
            $chatId = $message->getChat()->getId();
            $text = $message->getText();
            
            echo "Received message: " . $text . "\\n";
            
            $bot->sendMessage($chatId, 'Hello! I am your Telegram bot.');
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
?>`
    };
    
    return boilerplates[language] || boilerplates.javascript;
  }

  async ensureDependencies(bot) {
    const botDir = path.join(this.botsDir, bot.id);
    try {
      if (bot.language === 'javascript' || bot.language === 'typescript') {
        const nodeModulesPath = path.join(botDir, 'node_modules');
        const hasNodeModules = await fs.pathExists(nodeModulesPath);
        const pkgJsonPath = path.join(botDir, 'package.json');
        const hasPkg = await fs.pathExists(pkgJsonPath);
        if (hasPkg && !hasNodeModules) {
          this.addLog(bot.id, 'info', 'Installing Node.js dependencies...');
          await new Promise((resolve, reject) => {
            const install = spawn('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: botDir, env: { ...(process.env||{}) } });
            install.stdout.on('data', d => this.addLog(bot.id, 'info', d.toString()));
            install.stderr.on('data', d => this.addLog(bot.id, 'info', d.toString()));
            install.on('close', code => code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`)));
            install.on('error', err => reject(err));
          });
          this.addLog(bot.id, 'info', 'Node.js dependencies installed');
        }
      }

      if (bot.language === 'python') {
        const venvPath = path.join(botDir, '.venv');
        const reqPath = path.join(botDir, 'requirements.txt');
        const hasReq = await fs.pathExists(reqPath);
        if (hasReq) {
          this.addLog(bot.id, 'info', 'Installing Python dependencies...');
          await new Promise((resolve, reject) => {
            const pip = spawn('python3', ['-m', 'pip', 'install', '-r', 'requirements.txt', '--no-cache-dir'], { cwd: botDir, env: { ...(process.env||{}) } });
            pip.stdout.on('data', d => this.addLog(bot.id, 'info', d.toString()));
            pip.stderr.on('data', d => this.addError(bot.id, d.toString()));
            pip.on('close', code => code === 0 ? resolve() : reject(new Error(`pip install exited with ${code}`)));
            pip.on('error', err => reject(err));
          });
          this.addLog(bot.id, 'info', 'Python dependencies installed');
        }
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

    const bot = this.bots.get(botId);
    if (!bot) {
      return { success: false, error: 'Bot not found' };
    }

    const botDir = path.join(this.botsDir, botId);
    
    try {
      logger.info(`Starting bot ${botId} in directory: ${botDir}`);
      
      // Check if bot directory exists
      if (!await fs.pathExists(botDir)) {
        throw new Error(`Bot directory does not exist: ${botDir}`);
      }
      
      // Check if bot file exists
      const fileExtension = this.getFileExtension(bot.language);
      const botFile = `bot.${fileExtension}`;
      const botFilePath = path.join(botDir, botFile);
      
      if (!await fs.pathExists(botFilePath)) {
        throw new Error(`Bot file does not exist: ${botFilePath}`);
      }
      
      logger.info(`Bot file found: ${botFilePath}`);
      
      // Check for existing PID file and kill any existing process
      const pidFile = path.join(botDir, 'bot.pid');
      if (await fs.pathExists(pidFile)) {
        try {
          const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
          logger.info(`Found existing PID file for bot ${botId}, PID: ${pid}`);
          
          // Try to kill the existing process
          try {
            process.kill(-pid, 'SIGTERM');
            logger.info(`Sent SIGTERM to existing process ${pid}`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Force kill if still running
            try {
              process.kill(-pid, 'SIGKILL');
              logger.info(`Sent SIGKILL to existing process ${pid}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {}
            
            await fs.remove(pidFile);
            logger.info(`Killed existing process ${pid} and removed PID file`);
          } catch (killError) {
            logger.warn(`Could not kill existing process ${pid}: ${killError.message}`);
            // Remove PID file anyway
            try {
              await fs.remove(pidFile);
            } catch {}
          }
        } catch (fileError) {
          logger.warn(`Error reading PID file: ${fileError.message}`);
          // Remove corrupted PID file
          try {
            await fs.remove(pidFile);
          } catch {}
        }
      }
      
      let childProcess;
      
      // Set environment variables for the bot
      const env = {
        ...(process.env || {}),
        PATH: (process.env && process.env.PATH) || '/usr/local/bin:/usr/bin:/bin'
      };
      
      // Add bot-specific environment variables
      if (bot.environmentVariables && Array.isArray(bot.environmentVariables)) {
        bot.environmentVariables.forEach(envVar => {
          if (envVar.key && envVar.value !== undefined) {
            env[envVar.key] = envVar.value;
          }
        });
      } else {
        // Fallback to default environment variables
        env.BOT_TOKEN = bot.token;
        env.NODE_ENV = 'production';
      }
      
      logger.info(`Environment variables set for bot ${botId}: ${Object.keys(env).join(', ')}`);

      // Ensure per-bot dependencies are installed
      await this.ensureDependencies(bot);
      
      try {
        switch (bot.language) {
          case 'javascript':
            childProcess = spawn('node', [botFile], { cwd: botDir, env, detached: true });
            break;
          case 'typescript':
            childProcess = spawn('npx', ['ts-node', botFile], { cwd: botDir, env, detached: true });
            break;
          case 'python':
            childProcess = spawn('python', [botFile], { cwd: botDir, env, detached: true });
            break;
          case 'php':
            childProcess = spawn('php', [botFile], { cwd: botDir, env, detached: true });
            break;
          default:
            childProcess = spawn('node', [botFile], { cwd: botDir, env, detached: true });
        }
        logger.info(`Spawn successful for bot ${botId}`);
      } catch (spawnError) {
        logger.error(`Spawn error for bot ${botId}:`, spawnError);
        throw new Error(`Failed to spawn bot process: ${spawnError.message}`);
      }

      this.botProcesses.set(botId, childProcess);
      // Persist PID for recovery
      try {
        await fs.writeFile(path.join(botDir, 'bot.pid'), String(childProcess.pid));
      } catch {}
      
      // Handle process output
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
        // cleanup pid file
        try { fs.remove(path.join(this.botsDir, botId, 'bot.pid')); } catch {}
        this.addLog(botId, 'info', `Bot process exited with code ${code}`);
        if (this.io) {
          this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
        }
      });

      childProcess.on('error', (error) => {
        this.addError(botId, `Process error: ${error.message}`);
        this.botProcesses.delete(botId);
      });

      this.addLog(botId, 'info', 'Bot started successfully');
      if (this.io) {
        this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'running' });
      }
      
      return { success: true };
    } catch (error) {
      logger.error(`Error starting bot ${botId}:`, error);
      this.addError(botId, `Failed to start bot: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async stopBot(botId) {
    const childProcess = this.botProcesses.get(botId);
    if (!childProcess) {
      // Check if there's a PID file and try to kill that process
      const botDir = path.join(this.botsDir, botId);
      const pidFile = path.join(botDir, 'bot.pid');
      
      try {
        if (await fs.pathExists(pidFile)) {
          const pid = parseInt(await fs.readFile(pidFile, 'utf8'));
          logger.info(`Attempting to kill process ${pid} from PID file for bot ${botId}`);
          
          try {
            process.kill(-pid, 'SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Force kill if still running
            try {
              process.kill(-pid, 'SIGKILL');
            } catch {}
            
            await fs.remove(pidFile);
            logger.info(`Killed process ${pid} for bot ${botId}`);
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
      logger.info(`Stopping bot ${botId} with PID ${childProcess.pid}`);
      
      // First, try to kill the entire process group
      try {
        process.kill(-childProcess.pid, 'SIGTERM');
        logger.info(`Sent SIGTERM to process group ${childProcess.pid}`);
      } catch (groupError) {
        logger.warn(`Could not kill process group: ${groupError.message}`);
        // Fallback to direct process kill
        try {
          childProcess.kill('SIGTERM');
          logger.info(`Sent SIGTERM to process ${childProcess.pid}`);
        } catch (directError) {
          logger.warn(`Could not kill process directly: ${directError.message}`);
        }
      }

      // Wait for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if process is still running
      if (this.botProcesses.has(botId)) {
        logger.warn(`Process still running after SIGTERM, sending SIGKILL`);
        
        // Force kill the entire process group
        try {
          process.kill(-childProcess.pid, 'SIGKILL');
          logger.info(`Sent SIGKILL to process group ${childProcess.pid}`);
        } catch (groupError) {
          logger.warn(`Could not SIGKILL process group: ${groupError.message}`);
          // Fallback to direct process kill
          try {
            childProcess.kill('SIGKILL');
            logger.info(`Sent SIGKILL to process ${childProcess.pid}`);
          } catch (directError) {
            logger.warn(`Could not SIGKILL process directly: ${directError.message}`);
          }
        }
        
        // Wait a bit more
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Clean up PID file
      const botDir = path.join(this.botsDir, botId);
      const pidFile = path.join(botDir, 'bot.pid');
      try {
        await fs.remove(pidFile);
        logger.info(`Removed PID file for bot ${botId}`);
      } catch (fileError) {
        logger.warn(`Could not remove PID file: ${fileError.message}`);
      }

      // Remove from processes map
      this.botProcesses.delete(botId);
      
      logger.info(`Successfully stopped bot ${botId}`);
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
      // Stop bot if it's running
      if (this.botProcesses.has(botId)) {
        await this.stopBot(botId);
      }

      // Update configuration
      Object.assign(bot, updates, { updatedAt: new Date().toISOString() });
      
      // Ensure environment variables are properly structured
      if (updates.environmentVariables && Array.isArray(updates.environmentVariables)) {
        bot.environmentVariables = updates.environmentVariables;
      }
      
      const botDir = path.join(this.botsDir, botId);
      await fs.writeJson(path.join(botDir, 'config.json'), bot, { spaces: 2 });
      
      // Update bot file
      await this.createBotFile(botDir, bot);
      
      this.bots.set(botId, bot);
      
      // Restart bot if it was running and autoStart is enabled
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
      // Stop bot if it's running
      if (this.botProcesses.has(botId)) {
        await this.stopBot(botId);
      }

      // Remove bot directory
      const botDir = path.join(this.botsDir, botId);
      await fs.remove(botDir);
      
      // Clean up references
      this.bots.delete(botId);
      this.botProcesses.delete(botId);
      this.botLogs.delete(botId);
      this.botErrors.delete(botId);
      
      logger.info(`Deleted bot: ${botId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting bot ${botId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async cloneBot(sourceBotId) {
    try {
      const sourceBot = this.bots.get(sourceBotId);
      if (!sourceBot) {
        return { success: false, error: 'Source bot not found' };
      }

      // New bot id and directory
      const newBotId = uuidv4();
      const newBotDir = path.join(this.botsDir, newBotId);
      await fs.ensureDir(newBotDir);

      // Prepare new bot config
      const newConfig = {
        id: newBotId,
        name: `${sourceBot.name} (Copy)`,
        token: '',
        language: sourceBot.language,
        code: sourceBot.code,
        autoStart: false,
        // Do not clone original env vars; set safe defaults
        environmentVariables: [
          { key: 'BOT_TOKEN', value: '', isSecret: true },
          { key: 'NODE_ENV', value: 'production', isSecret: false }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Persist config and bot file(s)
      await fs.writeJson(path.join(newBotDir, 'config.json'), newConfig, { spaces: 2 });
      await this.createBotFile(newBotDir, newConfig);

      // Initialize runtime maps
      this.botLogs.set(newBotId, []);
      this.botErrors.set(newBotId, []);
      this.bots.set(newBotId, newConfig);

      logger.info(`Cloned bot ${sourceBotId} -> ${newBotId}`);
      return { success: true, bot: newConfig };
    } catch (error) {
      logger.error(`Error cloning bot ${sourceBotId}:`, error);
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
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
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
    
    // Keep only last 100 errors
    if (errors.length > 100) {
      errors.splice(0, errors.length - 100);
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

  // Clean up orphaned processes on startup
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
            
            // Check if process is still running
            try {
              process.kill(pid, 0); // Signal 0 just checks if process exists
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
            // Remove corrupted PID file
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