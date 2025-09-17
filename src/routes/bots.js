const express = require('express');
const router = express.Router();
const BotManager = require('../botManager');
const BotService = require('../services/BotService');
const logger = require('../utils/logger');

let botManager;
try {
  botManager = BotManager.getInstance();
} catch (error) {
  logger.error('Failed to get bot manager instance:', error);
  botManager = null;
}

router.get('/', async (req, res) => {
  try {
    const bots = await BotService.getAllBots();
    res.json({ success: true, bots });
  } catch (error) {
    logger.error('Error getting bots:', error);
    res.status(500).json({ success: false, error: 'Failed to get bots' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bot = await BotService.getBot(req.params.id);
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    res.json({ success: true, config: bot });
  } catch (error) {
    logger.error('Error getting bot:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, token, language = 'javascript', autoStart = false, environmentVariables = [], code = '' } = req.body;
    
    if (!name || !token) {
      return res.status(400).json({ success: false, error: 'Name and token are required' });
    }

    const bot = await BotService.createBot({
      name,
      token,
      language,
      autoStart,
      environmentVariables,
      code
    });

    res.status(201).json({ success: true, config: bot });
  } catch (error) {
    logger.error('Error creating bot:', error);
    res.status(500).json({ success: false, error: 'Failed to create bot' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const botId = req.params.id;
    const updateData = req.body;

    const bot = await BotService.updateBot(botId, updateData);
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    res.json({ success: true, config: bot });
  } catch (error) {
    logger.error('Error updating bot:', error);
    res.status(500).json({ success: false, error: 'Failed to update bot' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const botId = req.params.id;
    
    let success = false;
    if (botManager) {
      // Ensure process, in-memory state, DB docs, and files are all cleaned
      success = await botManager.deleteBot(botId);
    } else {
      success = await BotService.deleteBot(botId);
    }
    if (!success) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    res.json({ success: true, message: 'Bot deleted successfully' });
  } catch (error) {
    logger.error('Error deleting bot:', error);
    res.status(500).json({ success: false, error: 'Failed to delete bot' });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }

    const botId = req.params.id;
    const bot = await BotService.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await botManager.startBot(botId);
    await BotService.updateBot(botId, { status: 'running' });
    
    res.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    logger.error('Error starting bot:', error);
    res.status(500).json({ success: false, error: 'Failed to start bot' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }

    const botId = req.params.id;
    const bot = await BotService.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await botManager.stopBot(botId);
    await BotService.updateBot(botId, { status: 'stopped' });
    
    res.json({ success: true, message: 'Bot stopped successfully' });
  } catch (error) {
    logger.error('Error stopping bot:', error);
    res.status(500).json({ success: false, error: 'Failed to stop bot' });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const botId = req.params.id;
    const limit = parseInt(req.query.limit) || 100;
    
    const logs = await BotService.getBotLogs(botId, limit);
    res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error getting bot logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot logs' });
  }
});

router.get('/:id/errors', async (req, res) => {
  try {
    const botId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const errors = await BotService.getBotErrors(botId, limit);
    res.json({ success: true, errors });
  } catch (error) {
    logger.error('Error getting bot errors:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot errors' });
  }
});

module.exports = router;