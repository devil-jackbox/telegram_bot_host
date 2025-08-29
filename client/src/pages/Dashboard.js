import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  Activity, 
  AlertTriangle,
  Clock,
  Code,
  Plus,
  BarChart3,
  Users,
  MessageSquare,
  Copy
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';

const Dashboard = () => {
  const { bots, loading, startBot, stopBot, deleteBot, cloneBot } = useBots();
  const [deletingBot, setDeletingBot] = useState(null);
  const [cloningBot, setCloningBot] = useState(null);

  const runningBots = bots.filter(bot => bot.status === 'running');
  const stoppedBots = bots.filter(bot => bot.status === 'stopped' || !bot.status);
  const errorBots = bots.filter(bot => bot.status === 'error');

  const handleStartBot = async (botId) => {
    try {
      await startBot(botId);
    } catch (error) {
      console.error('Failed to start bot:', error);
    }
  };

  const handleStopBot = async (botId) => {
    try {
      await stopBot(botId);
    } catch (error) {
      console.error('Failed to stop bot:', error);
    }
  };

  const handleCloneBot = async (botId) => {
    try {
      setCloningBot(botId);
      const newBot = await cloneBot(botId);
      if (newBot?.id) {
        // Navigate to the new bot editor
        window.location.href = `/bot/${newBot.id}`;
      }
    } catch (error) {
      console.error('Failed to clone bot:', error);
    } finally {
      setCloningBot(null);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    setDeletingBot(botId);
    try {
      await deleteBot(botId);
    } catch (error) {
      console.error('Failed to delete bot:', error);
    } finally {
      setDeletingBot(null);
    }
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <Code size={16} className="text-yellow-500" />;
      case 'python':
        return <Bot size={16} className="text-blue-500" />;
      default:
        return <Code size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (bot) => {
    if (bot.status === 'running') {
      return <span className="badge-success">Running</span>;
    }
    if (bot.status === 'error') {
      return <span className="badge-error">Error</span>;
    }
    return <span className="badge-warning">Stopped</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your Telegram bots</p>
        </div>
        <Link to="/" className="btn-primary">
          <Plus size={16} />
          Create Bot
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bot size={20} className="text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bots</p>
              <p className="text-2xl font-bold text-gray-900">{bots.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity size={20} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">{runningBots.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stopped</p>
              <p className="text-2xl font-bold text-gray-900">{stoppedBots.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">{errorBots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bots List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Bots</h2>
        </div>
        
        {bots.length === 0 ? (
          <div className="p-12 text-center">
            <Bot size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bots yet</h3>
            <p className="text-gray-600 mb-6">Create your first Telegram bot to get started</p>
            <Link to="/" className="btn-primary">
              <Plus size={16} />
              Create Your First Bot
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bots.map((bot) => (
              <div key={bot.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getLanguageIcon(bot.language)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{bot.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{bot.language}</p>
                      </div>
                    </div>
                    {getStatusBadge(bot)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {bot.status === 'running' ? (
                      <button
                        onClick={() => handleStopBot(bot.id)}
                        className="btn-secondary"
                        title="Stop Bot"
                      >
                        <Square size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartBot(bot.id)}
                        className="btn-success"
                        title="Start Bot"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    
                    <Link
                      to={`/bot/${bot.id}`}
                      className="btn-secondary"
                      title="Edit Bot"
                    >
                      <Edit size={16} />
                    </Link>
                    
                    <button
                      onClick={() => handleCloneBot(bot.id)}
                      disabled={cloningBot === bot.id}
                      className="btn-secondary"
                      title="Clone Bot"
                    >
                      {cloningBot === bot.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      disabled={deletingBot === bot.id}
                      className="btn-danger"
                      title="Delete Bot"
                    >
                      {deletingBot === bot.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>Created {new Date(bot.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">ID:</span>
                    <span className="font-mono truncate max-w-[220px]" title={bot.id}>{bot.id}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(bot.id)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy bot ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {bot.updatedAt && (
                    <div className="flex items-center space-x-1">
                      <Edit size={14} />
                      <span>Updated {new Date(bot.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;