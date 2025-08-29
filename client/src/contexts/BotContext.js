import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BotContext = createContext();

export const useBots = () => {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBots must be used within a BotProvider');
  }
  return context;
};

export const BotProvider = ({ children }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
      ? '/api' 
      : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api'),
    timeout: 10000,
  });

  // Fetch all bots
  const fetchBots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bots');
      setBots(response.data.bots || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch bots');
      toast.error('Failed to fetch bots');
    } finally {
      setLoading(false);
    }
  };

  // Create a new bot
  const createBot = async (botData) => {
    try {
      const response = await api.post('/bots', botData);
      if (response.data.success) {
        setBots(prev => [...prev, response.data.config]);
        toast.success('Bot created successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to create bot: ${errorMsg}`);
      throw err;
    }
  };

  // Update a bot
  const updateBot = async (botId, updates) => {
    try {
      const response = await api.put(`/bots/${botId}`, updates);
      if (response.data.success) {
        // Update with the returned bot data if available, otherwise use updates
        const updatedBot = response.data.bot || { ...updates };
        setBots(prev => prev.map(bot => 
          bot.id === botId ? { ...bot, ...updatedBot } : bot
        ));
        toast.success('Bot updated successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to update bot: ${errorMsg}`);
      throw err;
    }
  };

  // Delete a bot
  const deleteBot = async (botId) => {
    try {
      const response = await api.delete(`/bots/${botId}`);
      if (response.data.success) {
        setBots(prev => prev.filter(bot => bot.id !== botId));
        toast.success('Bot deleted successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to delete bot: ${errorMsg}`);
      throw err;
    }
  };

  // Clone a bot
  const cloneBot = async (botId) => {
    try {
      const response = await api.post(`/bots/${botId}/clone`);
      if (response.data.success) {
        const newBot = response.data.bot;
        setBots(prev => [...prev, newBot]);
        toast.success('Bot cloned successfully!');
        return newBot;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to clone bot: ${errorMsg}`);
      throw err;
    }
  };

  // Start a bot
  const startBot = async (botId) => {
    try {
      const response = await api.post(`/bots/${botId}/start`);
      if (response.data.success) {
        setBots(prev => prev.map(bot => 
          bot.id === botId ? { ...bot, status: 'running' } : bot
        ));
        toast.success('Bot started successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to start bot: ${errorMsg}`);
      throw err;
    }
  };

  // Stop a bot
  const stopBot = async (botId) => {
    try {
      const response = await api.post(`/bots/${botId}/stop`);
      if (response.data.success) {
        setBots(prev => prev.map(bot => 
          bot.id === botId ? { ...bot, status: 'stopped' } : bot
        ));
        toast.success('Bot stopped successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to stop bot: ${errorMsg}`);
      throw err;
    }
  };

  // Get bot logs
  const getBotLogs = async (botId, options = {}) => {
    try {
      const params = new URLSearchParams(options);
      const response = await api.get(`/bots/${botId}/logs?${params}`);
      return response.data.logs || [];
    } catch (err) {
      toast.error('Failed to fetch bot logs');
      return [];
    }
  };

  // Get bot errors
  const getBotErrors = async (botId, options = {}) => {
    try {
      const params = new URLSearchParams(options);
      const response = await api.get(`/bots/${botId}/errors?${params}`);
      return response.data.errors || [];
    } catch (err) {
      toast.error('Failed to fetch bot errors');
      return [];
    }
  };

  // Get supported languages
  const getSupportedLanguages = async () => {
    try {
      // Force JavaScript only on the client
      return [{ id: 'javascript', name: 'JavaScript', extension: 'js' }];
    } catch (err) {
      return [{ id: 'javascript', name: 'JavaScript', extension: 'js' }];
    }
  };

  // Get bot file content
  const getBotFile = async (botId) => {
    try {
      const response = await api.get(`/files/${botId}`);
      return response.data;
    } catch (err) {
      toast.error('Failed to fetch bot file');
      throw err;
    }
  };

  // Update bot file content
  const updateBotFile = async (botId, content) => {
    try {
      const response = await api.put(`/files/${botId}`, { content });
      if (response.data.success) {
        toast.success('Bot file updated successfully!');
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to update bot file: ${errorMsg}`);
      throw err;
    }
  };

  // Get a single bot
  const getBot = async (botId) => {
    try {
      const response = await api.get(`/bots/${botId}`);
      if (response.data.success) {
        // Update the bot in the local state
        setBots(prevBots => {
          const existingBot = prevBots.find(b => b.id === botId);
          if (existingBot) {
            return prevBots.map(b => b.id === botId ? response.data.bot : b);
          } else {
            return [...prevBots, response.data.bot];
          }
        });
        return response.data.bot;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Failed to fetch bot: ${errorMsg}`);
      throw err;
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const value = {
    bots,
    loading,
    error,
    fetchBots,
    createBot,
    updateBot,
    deleteBot,
    startBot,
    stopBot,
    cloneBot,
    getBot,
    getBotLogs,
    getBotErrors,
    getSupportedLanguages,
    getBotFile,
    updateBotFile,
  };

  return (
    <BotContext.Provider value={value}>
      {children}
    </BotContext.Provider>
  );
};