const express = require('express');
const router = express.Router();
const BotManager = require('../botManager');
const logger = require('../utils/logger');

// Create bot manager instance
let botManager;
try {
  botManager = new BotManager();
} catch (error) {
  logger.error('Failed to initialize bot manager:', error);
  botManager = null;
}

// Get all bots
router.get('/', (req, res) => {
  try {
    const bots = botManager.getAllBots();
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific bot
router.get('/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const status = botManager.getBotStatus(botId);
    res.json({ success: true, bot, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new bot
router.post('/', async (req, res) => {
  try {
    const { name, token, language, code, autoStart } = req.body;
    
    if (!name || !token || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, token, and language are required' 
      });
    }
    
    const result = await botManager.createBot({
      name,
      token,
      language,
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

// Update a bot
router.put('/:botId', async (req, res) => {
  try {
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

// Delete a bot
router.delete('/:botId', async (req, res) => {
  try {
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

// Start a bot
router.post('/:botId/start', async (req, res) => {
  try {
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

// Stop a bot
router.post('/:botId/stop', async (req, res) => {
  try {
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

// Get bot logs
router.get('/:botId/logs', (req, res) => {
  try {
    const { botId } = req.params;
    const logs = botManager.getBotLogs(botId);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bot errors
router.get('/:botId/errors', (req, res) => {
  try {
    const { botId } = req.params;
    const errors = botManager.getBotErrors(botId);
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get supported languages
router.get('/languages/supported', (req, res) => {
  const languages = [
    { id: 'javascript', name: 'JavaScript', extension: 'js' },
    { id: 'typescript', name: 'TypeScript', extension: 'ts' },
    { id: 'python', name: 'Python', extension: 'py' },
    { id: 'php', name: 'PHP', extension: 'php' },
    { id: 'ruby', name: 'Ruby', extension: 'rb' },
    { id: 'go', name: 'Go', extension: 'go' }
  ];
  
  res.json({ success: true, languages });
});

module.exports = router;