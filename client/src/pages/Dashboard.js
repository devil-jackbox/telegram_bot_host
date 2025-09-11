import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateBotModal from '../components/CreateBotModal';
import { 
  Bot, 
  Activity, 
  Clock,
  Code,
  Plus
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';

const Dashboard = () => {
  const { bots, loading } = useBots();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const runningBots = bots.filter(bot => bot.status === 'running');
  const stoppedBots = bots.filter(bot => bot.status === 'stopped' || !bot.status);

  // Removed unused action handlers and language icon helper

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your Telegram bots</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create Bot</span>
          <span className="sm:hidden">New Bot</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <div className="flex items-center justify-center space-x-2 px-2 sm:px-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bot size={18} className="text-primary-600" />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">All Bots</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{bots.length}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 px-2 sm:px-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity size={18} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Running</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{runningBots.length}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 px-2 sm:px-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={18} className="text-yellow-600" />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Stopped</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stoppedBots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bots List */}
      <div className="card">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">Your Bots</h2>
        </div>
        
        {bots.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Bot size={40} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bots yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first Telegram bot to get started</p>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium"
            >
              <Plus size={16} />
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bots.map((bot) => (
              <Link
                key={bot.id}
                to={`/bot/${bot.id}`}
                className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{bot.name}</h3>
                      </div>
                    </div>
                    {getStatusBadge(bot)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateBotModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};

export default Dashboard;