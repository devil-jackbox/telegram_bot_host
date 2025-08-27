import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  Filter,
  Clock,
  Info,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';
import { useSocket } from '../contexts/SocketContext';

const BotLogs = () => {
  const { botId } = useParams();
  const { bots, getBotLogs } = useBots();
  const { joinBotRoom, leaveBotRoom } = useSocket();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const bot = bots.find(b => b.id === botId);

  useEffect(() => {
    if (botId) {
      joinBotRoom(botId);
      loadLogs();
    }

    return () => {
      if (botId) {
        leaveBotRoom(botId);
      }
    };
  }, [botId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsData = await getBotLogs(botId, { limit: 1000 });
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
    }
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.level === filter);
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'warn':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const getLogLevelBadge = (level) => {
    const classes = {
      error: 'badge-error',
      warn: 'badge-warning',
      info: 'badge-info',
      debug: 'badge-secondary'
    };
    
    return (
      <span className={`badge ${classes[level] || 'badge-secondary'}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  if (!bot) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bot Not Found</h2>
        <p className="text-gray-600 mb-4">The bot you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link to={`/bot/${botId}`} className="text-primary-600 hover:text-primary-700">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Bot Logs</h1>
          </div>
          <p className="text-gray-600 mt-1">{bot.name}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            onClick={clearLogs}
            className="btn-danger"
          >
            <Trash2 size={16} />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warn">Warnings Only</option>
              <option value="info">Info Only</option>
              <option value="debug">Debug Only</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Logs ({getFilteredLogs().length})
            </h2>
            <span className="text-sm text-gray-500">
              {logs.length} total entries
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading logs...</p>
          </div>
        ) : getFilteredLogs().length === 0 ? (
          <div className="p-8 text-center">
            <Info size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">There are no logs to display for this bot.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {getFilteredLogs().map((log, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getLogIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getLogLevelBadge(log.level)}
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotLogs;