const express = require('express');
const router = express.Router();
const BotService = require('../services/BotService');
const logger = require('../utils/logger');

router.get('/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const fileName = 'bot.js';
    
    const code = await BotService.getBotCode(botId);
    
    res.json({ 
      success: true, 
      content: code,
      fileName: fileName
    });
  } catch (error) {
    logger.error('Error getting bot file:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot file' });
  }
});

router.put('/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const { content } = req.body;
    
    if (content === undefined) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    await BotService.updateBotCode(botId, content);
    
    res.json({ success: true, message: 'Bot file updated successfully' });
  } catch (error) {
    logger.error('Error updating bot file:', error);
    res.status(500).json({ success: false, error: 'Failed to update bot file' });
  }
});

module.exports = router;