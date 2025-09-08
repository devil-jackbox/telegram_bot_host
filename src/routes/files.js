const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const BotManager = require('../botManager');
const logger = require('../utils/logger');

let botManager;
try {
  botManager = BotManager.getInstance();
} catch (error) {
  logger.error('Failed to get bot manager instance:', error);
  botManager = null;
}

router.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const botDir = path.join(botManager.botsDir, botId);
    const fileName = 'bot.js';
    const filePath = path.join(botDir, fileName);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: 'Bot file not found' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, content, fileName });
  } catch (error) {
    logger.error('File read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:botId', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const bot = botManager.getBot(botId);
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const result = await botManager.updateBot(botId, { code: content });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:botId/structure', async (req, res) => {
  try {
    if (!botManager) {
      return res.status(500).json({ success: false, error: 'Bot manager not available' });
    }
    
    const { botId } = req.params;
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const botDir = path.join(botManager.botsDir, botId);
    
    if (!await fs.pathExists(botDir)) {
      return res.status(404).json({ success: false, error: 'Bot directory not found' });
    }
    
    const files = await fs.readdir(botDir);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(botDir, file);
      const stats = await fs.stat(filePath);
      fileList.push({
        name: file,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      });
    }
    
    res.json({ success: true, files: fileList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;