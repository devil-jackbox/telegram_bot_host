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

router.get('/:botId', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const { level, limit = 100 } = req.query;
    
    let logs = botManager.getBotLogs(botId);
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    logs = logs.slice(-parseInt(limit));
    
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
    const { limit = 50 } = req.query;
    
    let errors = botManager.getBotErrors(botId);
    
    errors = errors.slice(-parseInt(limit));
    
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:botId', (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const { type = 'all' } = req.query;
    
    if (type === 'logs' || type === 'all') {
      botManager.botLogs.set(botId, []);
    }
    
    if (type === 'errors' || type === 'all') {
      botManager.botErrors.set(botId, []);
    }
    
    res.json({ success: true, message: `Cleared ${type} for bot ${botId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/system/combined', (req, res) => {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    const logsPath = path.join(__dirname, '../../logs/combined.log');
    
    if (!fs.existsSync(logsPath)) {
      return res.json({ success: true, logs: [] });
    }
    
    const logs = fs.readFileSync(logsPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: new Date().toISOString() };
        }
      })
      .slice(-100);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/system/errors', (req, res) => {
  try {
    const fs = require('fs-extra');
    const path = require('path');
    const errorsPath = path.join(__dirname, '../../logs/error.log');
    
    if (!fs.existsSync(errorsPath)) {
      return res.json({ success: true, errors: [] });
    }
    
    const errors = fs.readFileSync(errorsPath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line, timestamp: new Date().toISOString() };
        }
      })
      .slice(-50);
    
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;