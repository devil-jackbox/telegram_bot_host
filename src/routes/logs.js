const express = require('express');
const router = express.Router();
const { botManager } = require('../server');

// Get all logs for a bot
router.get('/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const { level, limit = 100 } = req.query;
    
    let logs = botManager.getBotLogs(botId);
    
    // Filter by level if specified
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    // Limit results
    logs = logs.slice(-parseInt(limit));
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all errors for a bot
router.get('/:botId/errors', (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;
    
    let errors = botManager.getBotErrors(botId);
    
    // Limit results
    errors = errors.slice(-parseInt(limit));
    
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear logs for a bot
router.delete('/:botId', (req, res) => {
  try {
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

// Get system logs
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
      .slice(-100); // Last 100 lines
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system errors
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
      .slice(-50); // Last 50 lines
    
    res.json({ success: true, errors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;