// Simple JavaScript Telegram Bot for Testing
// This bot responds to basic commands and messages

const TelegramBot = require('node-telegram-bot-api');

// Get bot token from environment variable
const token = process.env.BOT_TOKEN;

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot is starting...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'User';
  
  const welcomeMessage = `👋 Hello ${userName}!
  
Welcome to the Test Bot! 🎉

Available commands:
• /start - Show this welcome message
• /help - Show help information
• /ping - Test if bot is responsive
• /info - Show bot information
• /echo [text] - Echo back your message

Try sending me a message or use one of the commands above!`;

  bot.sendMessage(chatId, welcomeMessage);
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `📚 Help - Test Bot Commands

Commands:
• /start - Welcome message
• /help - This help message
• /ping - Test bot responsiveness
• /info - Bot information
• /echo [text] - Echo your message

Features:
• Responds to text messages
• Handles basic commands
• Shows bot status
• Simple echo functionality

This is a test bot to verify the platform is working correctly! 🚀`;

  bot.sendMessage(chatId, helpMessage);
});

// Handle /ping command
bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  const timestamp = new Date().toISOString();
  
  bot.sendMessage(chatId, `🏓 Pong! Bot is alive and responsive!\n⏰ Time: ${timestamp}`);
});

// Handle /info command
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const chatInfo = msg.chat;
  const userInfo = msg.from;
  
  const infoMessage = `ℹ️ Bot Information

Chat Details:
• Chat ID: ${chatInfo.id}
• Chat Type: ${chatInfo.type}
• Chat Title: ${chatInfo.title || 'N/A'}

User Details:
• User ID: ${userInfo.id}
• Username: ${userInfo.username || 'N/A'}
• First Name: ${userInfo.first_name || 'N/A'}
• Last Name: ${userInfo.last_name || 'N/A'}

Bot Status: ✅ Running
Platform: Telegram Bot Hosting Platform
Language: JavaScript`;

  bot.sendMessage(chatId, infoMessage);
});

// Handle /echo command
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const echoText = match[1];
  
  bot.sendMessage(chatId, `🔄 Echo: ${echoText}`);
});

// Handle regular text messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Ignore commands (they're handled separately)
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Respond to regular messages
  if (text) {
    const response = `📝 You said: "${text}"
    
This is a test bot response. The platform is working correctly! 🎉

Try using commands like /help or /ping to test more features.`;
    
    bot.sendMessage(chatId, response);
  }
});

// Handle errors
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Bot is running and ready to receive messages!');
console.log('📱 Send /start to your bot to begin testing');