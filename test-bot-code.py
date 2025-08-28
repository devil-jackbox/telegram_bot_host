#!/usr/bin/env python3
"""
Simple Python Telegram Bot for Testing
This bot responds to basic commands and messages
"""

import os
import logging
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get bot token from environment variable
TOKEN = os.environ.get('BOT_TOKEN')

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    user_name = user.first_name if user.first_name else "User"
    
    welcome_message = f"""👋 Hello {user_name}!

Welcome to the Test Bot! 🎉

Available commands:
• /start - Show this welcome message
• /help - Show help information
• /ping - Test if bot is responsive
• /info - Show bot information
• /echo [text] - Echo back your message

Try sending me a message or use one of the commands above!"""

    await update.message.reply_text(welcome_message)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    help_message = """📚 Help - Test Bot Commands

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

This is a test bot to verify the platform is working correctly! 🚀"""

    await update.message.reply_text(help_message)

async def ping(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /ping is issued."""
    timestamp = datetime.now().isoformat()
    await update.message.reply_text(f"🏓 Pong! Bot is alive and responsive!\n⏰ Time: {timestamp}")

async def info(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /info is issued."""
    chat = update.effective_chat
    user = update.effective_user
    
    info_message = f"""ℹ️ Bot Information

Chat Details:
• Chat ID: {chat.id}
• Chat Type: {chat.type}
• Chat Title: {chat.title if chat.title else 'N/A'}

User Details:
• User ID: {user.id}
• Username: {user.username if user.username else 'N/A'}
• First Name: {user.first_name if user.first_name else 'N/A'}
• Last Name: {user.last_name if user.last_name else 'N/A'}

Bot Status: ✅ Running
Platform: Telegram Bot Hosting Platform
Language: Python"""

    await update.message.reply_text(info_message)

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Echo the user message."""
    if context.args:
        echo_text = ' '.join(context.args)
        await update.message.reply_text(f"🔄 Echo: {echo_text}")
    else:
        await update.message.reply_text("Please provide text to echo. Usage: /echo [text]")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle regular text messages."""
    text = update.message.text
    
    # Ignore commands (they're handled separately)
    if text and text.startswith('/'):
        return
    
    # Respond to regular messages
    if text:
        response = f"""📝 You said: "{text}"

This is a test bot response. The platform is working correctly! 🎉

Try using commands like /help or /ping to test more features."""
        
        await update.message.reply_text(response)

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log Errors caused by Updates."""
    logger.warning('Update "%s" caused error "%s"', update, context.error)

def main() -> None:
    """Start the bot."""
    print("🤖 Bot is starting...")
    
    # Create the Application
    application = Application.builder().token(TOKEN).build()

    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("ping", ping))
    application.add_handler(CommandHandler("info", info))
    application.add_handler(CommandHandler("echo", echo))
    
    # Add message handler for regular text messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Add error handler
    application.add_error_handler(error_handler)

    # Start the Bot
    print("✅ Bot is running and ready to receive messages!")
    print("📱 Send /start to your bot to begin testing")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()