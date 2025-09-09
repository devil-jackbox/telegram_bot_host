const express = require('express');
const router = express.Router();
const BotService = require('../services/BotService');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const logs = await BotService.getAllLogs(limit);
    res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error getting all logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

router.get('/bot/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const limit = parseInt(req.query.limit) || 100;
    const logs = await BotService.getBotLogs(botId, limit);
    res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error getting bot logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot logs' });
  }
});

router.delete('/bot/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    await BotService.clearBotLogs(botId);
    res.json({ success: true, message: 'Bot logs cleared successfully' });
  } catch (error) {
    logger.error('Error clearing bot logs:', error);
    res.status(500).json({ success: false, error: 'Failed to clear bot logs' });
  }
});

router.delete('/', async (req, res) => {
  try {
    await BotService.clearAllLogs();
    res.json({ success: true, message: 'All logs cleared successfully' });
  } catch (error) {
    logger.error('Error clearing all logs:', error);
    res.status(500).json({ success: false, error: 'Failed to clear all logs' });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const errors = await BotService.getAllErrors(limit);
    res.json({ success: true, errors });
  } catch (error) {
    logger.error('Error getting all errors:', error);
    res.status(500).json({ success: false, error: 'Failed to get errors' });
  }
});

router.get('/errors/bot/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const limit = parseInt(req.query.limit) || 50;
    const errors = await BotService.getBotErrors(botId, limit);
    res.json({ success: true, errors });
  } catch (error) {
    logger.error('Error getting bot errors:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot errors' });
  }
});

router.delete('/errors/bot/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    await BotService.clearBotErrors(botId);
    res.json({ success: true, message: 'Bot errors cleared successfully' });
  } catch (error) {
    logger.error('Error clearing bot errors:', error);
    res.status(500).json({ success: false, error: 'Failed to clear bot errors' });
  }
});

router.delete('/errors', async (req, res) => {
  try {
    await BotService.clearAllErrors();
    res.json({ success: true, message: 'All errors cleared successfully' });
  } catch (error) {
    logger.error('Error clearing all errors:', error);
    res.status(500).json({ success: false, error: 'Failed to clear all errors' });
  }
});

module.exports = router;