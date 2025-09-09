const Bot = require('../database/models/Bot');
const BotCode = require('../database/models/BotCode');
const BotEnvironmentVariable = require('../database/models/BotEnvironmentVariable');
const BotLog = require('../database/models/BotLog');
const BotError = require('../database/models/BotError');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

class BotService {
  async createBot(botData) {
    try {
      const { name, token, language = 'javascript', autoStart = false, environmentVariables = [] } = botData;
      
      const bot = new Bot({
        id: require('uuid').v4(),
        name,
        token: encrypt(token),
        language,
        autoStart,
        status: 'stopped'
      });

      await bot.save();

      const botCode = new BotCode({
        botId: bot.id,
        code: ''
      });
      await botCode.save();

      const botEnvVars = new BotEnvironmentVariable({
        botId: bot.id,
        environmentVariables
      });
      await botEnvVars.save();

      const botResponse = bot.toObject();
      botResponse.token = decrypt(botResponse.token);
      
      logger.info(`Bot created: ${bot.id}`);
      return botResponse;
    } catch (error) {
      logger.error('Error creating bot:', error);
      throw error;
    }
  }

  async getBot(botId) {
    try {
      const bot = await Bot.findOne({ id: botId });
      if (!bot) return null;

      const botResponse = bot.toObject();
      botResponse.token = decrypt(botResponse.token);
      return botResponse;
    } catch (error) {
      logger.error('Error getting bot:', error);
      throw error;
    }
  }

  async getAllBots() {
    try {
      const bots = await Bot.find().sort({ createdAt: -1 });
      return bots.map(bot => {
        const botResponse = bot.toObject();
        botResponse.token = decrypt(botResponse.token);
        return botResponse;
      });
    } catch (error) {
      logger.error('Error getting all bots:', error);
      throw error;
    }
  }

  async updateBot(botId, updateData) {
    try {
      const updateFields = { ...updateData };
      
      if (updateFields.token) {
        updateFields.token = encrypt(updateFields.token);
      }

      const bot = await Bot.findOneAndUpdate(
        { id: botId },
        { ...updateFields, updatedAt: new Date() },
        { new: true }
      );

      if (!bot) return null;

      const botResponse = bot.toObject();
      botResponse.token = decrypt(botResponse.token);
      return botResponse;
    } catch (error) {
      logger.error('Error updating bot:', error);
      throw error;
    }
  }

  async deleteBot(botId) {
    try {
      await Bot.findOneAndDelete({ id: botId });
      await BotCode.findOneAndDelete({ botId });
      await BotEnvironmentVariable.findOneAndDelete({ botId });
      await BotLog.deleteMany({ botId });
      await BotError.deleteMany({ botId });

      logger.info(`Bot deleted: ${botId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting bot:', error);
      throw error;
    }
  }

  async getBotCode(botId) {
    try {
      const botCode = await BotCode.findOne({ botId });
      return botCode ? botCode.code : '';
    } catch (error) {
      logger.error('Error getting bot code:', error);
      throw error;
    }
  }

  async updateBotCode(botId, code) {
    try {
      await BotCode.findOneAndUpdate(
        { botId },
        { code, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      logger.error('Error updating bot code:', error);
      throw error;
    }
  }

  async getBotEnvironmentVariables(botId) {
    try {
      const botEnvVars = await BotEnvironmentVariable.findOne({ botId });
      return botEnvVars ? botEnvVars.environmentVariables : [];
    } catch (error) {
      logger.error('Error getting bot environment variables:', error);
      throw error;
    }
  }

  async updateBotEnvironmentVariables(botId, environmentVariables) {
    try {
      await BotEnvironmentVariable.findOneAndUpdate(
        { botId },
        { environmentVariables, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      logger.error('Error updating bot environment variables:', error);
      throw error;
    }
  }

  async addBotLog(botId, level, message) {
    try {
      const botLog = new BotLog({
        botId,
        level,
        message,
        timestamp: new Date()
      });
      await botLog.save();
      return true;
    } catch (error) {
      logger.error('Error adding bot log:', error);
      throw error;
    }
  }

  async getBotLogs(botId, limit = 100) {
    try {
      const logs = await BotLog.find({ botId })
        .sort({ timestamp: -1 })
        .limit(limit);
      return logs;
    } catch (error) {
      logger.error('Error getting bot logs:', error);
      throw error;
    }
  }

  async addBotError(botId, error) {
    try {
      const botError = new BotError({
        botId,
        error,
        timestamp: new Date()
      });
      await botError.save();
      return true;
    } catch (error) {
      logger.error('Error adding bot error:', error);
      throw error;
    }
  }

  async getBotErrors(botId, limit = 50) {
    try {
      const errors = await BotError.find({ botId })
        .sort({ timestamp: -1 })
        .limit(limit);
      return errors;
    } catch (error) {
      logger.error('Error getting bot errors:', error);
      throw error;
    }
  }

  async clearBotLogs(botId) {
    try {
      await BotLog.deleteMany({ botId });
      return true;
    } catch (error) {
      logger.error('Error clearing bot logs:', error);
      throw error;
    }
  }

  async clearBotErrors(botId) {
    try {
      await BotError.deleteMany({ botId });
      return true;
    } catch (error) {
      logger.error('Error clearing bot errors:', error);
      throw error;
    }
  }

  async getAllLogs(limit = 1000) {
    try {
      const logs = await BotLog.find()
        .sort({ timestamp: -1 })
        .limit(limit);
      return logs;
    } catch (error) {
      logger.error('Error getting all logs:', error);
      throw error;
    }
  }

  async getAllErrors(limit = 100) {
    try {
      const errors = await BotError.find()
        .sort({ timestamp: -1 })
        .limit(limit);
      return errors;
    } catch (error) {
      logger.error('Error getting all errors:', error);
      throw error;
    }
  }

  async clearAllLogs() {
    try {
      await BotLog.deleteMany({});
      return true;
    } catch (error) {
      logger.error('Error clearing all logs:', error);
      throw error;
    }
  }

  async clearAllErrors() {
    try {
      await BotError.deleteMany({});
      return true;
    } catch (error) {
      logger.error('Error clearing all errors:', error);
      throw error;
    }
  }
}

module.exports = new BotService();