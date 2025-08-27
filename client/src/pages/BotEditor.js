import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { 
  Save, 
  Play, 
  Square, 
  RotateCcw, 
  FileText, 
  AlertTriangle,
  Settings,
  Activity,
  Clock
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';
import { useSocket } from '../contexts/SocketContext';

const BotEditor = () => {
  const { botId } = useParams();
  const { bots, getBotFile, updateBotFile, startBot, stopBot, updateBot } = useBots();
  const { joinBotRoom, leaveBotRoom } = useSocket();
  
  const [code, setCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bot, setBot] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (botId) {
      joinBotRoom(botId);
      loadBotData();
    }

    return () => {
      if (botId) {
        leaveBotRoom(botId);
      }
    };
  }, [botId]);

  const loadBotData = async () => {
    try {
      setLoading(true);
      
      // Find bot in context
      const currentBot = bots.find(b => b.id === botId);
      if (!currentBot) {
        throw new Error('Bot not found');
      }
      setBot(currentBot);

      // Load bot file
      const fileData = await getBotFile(botId);
      setCode(fileData.content || '');
      setOriginalCode(fileData.content || '');
      
    } catch (error) {
      console.error('Failed to load bot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (code === originalCode) {
      return; // No changes
    }

    setSaving(true);
    try {
      await updateBotFile(botId, code);
      setOriginalCode(code);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    try {
      await startBot(botId);
    } catch (error) {
      console.error('Failed to start bot:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopBot(botId);
    } catch (error) {
      console.error('Failed to stop bot:', error);
    }
  };

  const handleRestart = async () => {
    try {
      await stopBot(botId);
      setTimeout(async () => {
        await startBot(botId);
      }, 1000);
    } catch (error) {
      console.error('Failed to restart bot:', error);
    }
  };

  const getLanguage = () => {
    if (!bot) return 'javascript';
    
    const languageMap = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'php': 'php',
      'ruby': 'ruby',
      'go': 'go'
    };
    
    return languageMap[bot.language] || 'javascript';
  };

  const getStatusBadge = () => {
    if (!bot) return null;
    
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

  if (!bot) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
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
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{bot.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600 mt-1">
            {bot.language} • Created {new Date(bot.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={saving || code === originalCode}
            className="btn-primary"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          {bot.status === 'running' ? (
            <button onClick={handleStop} className="btn-secondary">
              <Square size={16} />
              Stop
            </button>
          ) : (
            <button onClick={handleStart} className="btn-success">
              <Play size={16} />
              Start
            </button>
          )}
          
          <button onClick={handleRestart} className="btn-secondary">
            <RotateCcw size={16} />
            Restart
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'editor'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Code Editor
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'editor' && (
        <div className="card">
          <div className="h-96">
            <Editor
              height="100%"
              language={getLanguage()}
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bot Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={bot.name}
                  onChange={(e) => setBot({ ...bot, name: e.target.value })}
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <input
                  type="text"
                  value={bot.language}
                  disabled
                  className="input mt-1 bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Token</label>
                <input
                  type="password"
                  value={bot.token}
                  onChange={(e) => setBot({ ...bot, token: e.target.value })}
                  className="input mt-1"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={bot.autoStart}
                  onChange={(e) => setBot({ ...bot, autoStart: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="autoStart" className="ml-2 block text-sm text-gray-900">
                  Auto-start on platform launch
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={async () => {
                  try {
                    await updateBot(botId, {
                      name: bot.name,
                      token: bot.token,
                      autoStart: bot.autoStart
                    });
                  } catch (error) {
                    console.error('Failed to update bot:', error);
                  }
                }}
                className="btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bot Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge()}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-900">
                  {new Date(bot.createdAt).toLocaleString()}
                </span>
              </div>
              
              {bot.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(bot.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotEditor;