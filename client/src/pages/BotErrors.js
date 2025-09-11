import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  AlertTriangle
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';
import { useSocket } from '../contexts/SocketContext';

const BotErrors = () => {
  const { botId } = useParams();
  const { bots, getBotErrors } = useBots();
  const { joinBotRoom, leaveBotRoom } = useSocket();
  
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const bot = bots.find(b => b.id === botId);

  useEffect(() => {
    if (botId) {
      joinBotRoom(botId);
      loadErrors();
    }

    return () => {
      if (botId) {
        leaveBotRoom(botId);
      }
    };
  }, [botId]);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const errorsData = await getBotErrors(botId, { limit: 100 });
      setErrors(errorsData);
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => {
    if (window.confirm('Are you sure you want to clear all errors?')) {
      setErrors([]);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Bot Errors</h1>
          </div>
          <p className="text-gray-600 mt-1">{bot.name}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadErrors}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            onClick={clearErrors}
            className="btn-danger"
          >
            <Trash2 size={16} />
            Clear Errors
          </button>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-gray-700">Error Monitoring</span>
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

      {/* Errors */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Errors ({errors.length})
            </h2>
            <span className="text-sm text-gray-500">
              {errors.length} total errors
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading errors...</p>
          </div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
            <p className="text-gray-600">Great! Your bot is running without any errors.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {errors.map((error, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <AlertTriangle size={16} className="text-red-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="badge-error">ERROR</span>
                          <span className="text-sm text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                          {error.error}
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

export default BotErrors;