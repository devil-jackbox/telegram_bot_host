const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { botManager } = require('../server');

// Get bot file content
router.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const botDir = path.join(__dirname, '../../bots', botId);
    const fileExtension = botManager.getFileExtension ? 
      botManager.getFileExtension(bot.language) : 
      (bot.language === 'javascript' ? 'js' : 'py');
    const fileName = `bot.${fileExtension}`;
    const filePath = path.join(botDir, fileName);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ success: false, error: 'Bot file not found' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ success: true, content, fileName });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update bot file content
router.put('/:botId', async (req, res) => {
  try {
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

// Get bot directory structure
router.get('/:botId/structure', async (req, res) => {
  try {
    const { botId } = req.params;
    const bot = botManager.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }
    
    const botDir = path.join(__dirname, '../../bots', botId);
    
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