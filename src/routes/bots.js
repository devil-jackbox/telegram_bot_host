const express = require('express');
const router = express.Router();
const BotManager = require('../botManager');
const logger = require('../utils/logger');

let botManager;
try {
  botManager = BotManager.getInstance();
} catch (error) {
  logger.error('Failed to get bot manager instance:', error);
  botManager = null;
}

router.get('/', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const bots = botManager.getAllBots().map(b => ({
      ...b,
      status: botManager.botProcesses && botManager.botProcesses.has(b.id) ? 'running' : 'stopped'
    }));
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:botId', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const status = botManager.botProcesses && botManager.botProcesses.has(botId) ? 'running' : 'stopped';
    res.json({ success: true, bot: { ...bot, status }, status: { running: status === 'running' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { name, token, code, autoStart } = req.body;
    
    if (!name || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and token are required' 
      });
    }

    const result = await botManager.createBot({
      name,
      token,
      language: 'javascript',
      code: code || '',
      autoStart: autoStart || false
    });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:botId', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const updates = req.body;
    
    const result = await botManager.updateBot(botId, updates);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:botId', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const result = await botManager.deleteBot(botId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:botId/start', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const result = await botManager.startBot(botId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:botId/stop', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const result = await botManager.stopBot(botId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:botId/logs', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const logs = botManager.getBotLogs(botId);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:botId/errors', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const errors = botManager.getBotErrors(botId);
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/languages/supported', (req, res) => {
  const languages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' }
  ];
  
  res.json({ success: true, languages });
});

module.exports = router;