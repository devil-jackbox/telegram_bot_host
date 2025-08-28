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
    
    // Load existing bots on startup
    this.loadExistingBots();
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
      
      // Start bot if autoStart is enabled
      if (config.autoStart) {
        this.startBot(botId);
      }
      
      return { success: true, botId, config };
    } catch (error) {
      logger.error(`Error creating bot ${botId}:`, error);
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

const bot = new TelegramBot('${token}', { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  console.log('Received message:', messageText);
  
  bot.sendMessage(chatId, 'Hello! I am your Telegram bot.');
});

console.log('Bot started successfully!');`,

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
      let process;
      
      // Set environment variables for the bot
      const env = {
        ...process.env,
        BOT_TOKEN: bot.token,
        NODE_ENV: 'production'
      };
      
      switch (bot.language) {
        case 'javascript':
          process = spawn('node', ['bot.js'], { cwd: botDir, env });
          break;
        case 'typescript':
          process = spawn('npx', ['ts-node', 'bot.ts'], { cwd: botDir, env });
          break;
        case 'python':
          process = spawn('python', ['bot.py'], { cwd: botDir, env });
          break;
        case 'php':
          process = spawn('php', ['bot.php'], { cwd: botDir, env });
          break;
        default:
          process = spawn('node', ['bot.js'], { cwd: botDir, env });
      }

      this.botProcesses.set(botId, process);
      
      // Handle process output
      process.stdout.on('data', (data) => {
        const log = data.toString().trim();
        this.addLog(botId, 'info', log);
      });

      process.stderr.on('data', (data) => {
        const error = data.toString().trim();
        this.addError(botId, error);
      });

      process.on('close', (code) => {
        this.botProcesses.delete(botId);
        this.addLog(botId, 'info', `Bot process exited with code ${code}`);
        if (this.io) {
          this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
        }
      });

      process.on('error', (error) => {
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
    const process = this.botProcesses.get(botId);
    if (!process) {
      return { success: false, error: 'Bot is not running' };
    }

    try {
      process.kill('SIGTERM');
      this.botProcesses.delete(botId);
      this.addLog(botId, 'info', 'Bot stopped');
      this.io.to(`bot-${botId}`).emit('bot-status', { botId, status: 'stopped' });
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
      
      const botDir = path.join(this.botsDir, botId);
      await fs.writeJson(path.join(botDir, 'config.json'), bot, { spaces: 2 });
      
      // Update bot file
      await this.createBotFile(botDir, bot);
      
      this.bots.set(botId, bot);
      
      // Restart bot if it was running
      if (updates.autoStart !== false) {
        this.startBot(botId);
      }
      
      return { success: true };
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

  stopAllBots() {
    for (const [botId] of this.botProcesses) {
      this.stopBot(botId);
    }
  }
}

module.exports = BotManager;