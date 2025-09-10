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
  Clock,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-hot-toast';

const BotEditor = () => {
  const { botId } = useParams();
  const { bots, getBot, getBotFile, updateBotFile, startBot, stopBot, updateBot, deleteBot } = useBots();
  const { joinBotRoom, leaveBotRoom } = useSocket();
  
  const [code, setCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bot, setBot] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [environmentVariables, setEnvironmentVariables] = useState([
    { key: 'BOT_TOKEN', value: '', isSecret: true },
    { key: 'BOT_MODE', value: 'polling', isSecret: false },
    { key: 'PROTECT_CONTENT', value: 'false', isSecret: false }
  ]);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

  const commonEnvVars = [
    'BOT_TOKEN',
    'NODE_ENV',
    'BOT_MODE',
    'PROTECT_CONTENT',
    'WEBHOOK_URL',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
    'API_KEY',
    'SECRET_KEY',
    'ACCESS_TOKEN',
    'REFRESH_TOKEN',
    'CLIENT_ID',
    'CLIENT_SECRET',
    'WEBHOOK_SECRET',
    'LOG_LEVEL',
    'DEBUG',
    'ENVIRONMENT',
    'REGION',
    'TIMEZONE',
    'LANGUAGE'
  ];
  const [showSecrets, setShowSecrets] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (botId) {
      try {
        joinBotRoom(botId);
        loadBotData();
      } catch (error) {
        console.error('Error in useEffect:', error);
        setHasError(true);
        setLoading(false);
      }
    }

    return () => {
      if (botId) {
        try {
          leaveBotRoom(botId);
        } catch (error) {
          console.error('Error leaving bot room:', error);
        }
      }
    };
  }, [botId, bots]);

  useEffect(() => {
    if (!botId) return;

    const handleBotStatus = (data) => {
      if (data.botId === botId) {
        console.log('Bot status update:', data);
        setBot(prevBot => prevBot ? { ...prevBot, status: data.status } : prevBot);
      }
    };

    const handleBotLog = (data) => {
      if (data.botId === botId) {
        setLogs(prevLogs => [...prevLogs, data.log]);
      }
    };

    const handleBotError = (data) => {
      if (data.botId === botId) {
        setErrors(prevErrors => [...prevErrors, data.error]);
      }
    };

    const socket = window.socket || null;
    if (socket) {
      socket.on('bot-status', handleBotStatus);
      socket.on('bot-log', handleBotLog);
      socket.on('bot-error', handleBotError);

      return () => {
        socket.off('bot-status', handleBotStatus);
        socket.off('bot-log', handleBotLog);
        socket.off('bot-error', handleBotError);
      };
    }
  }, [botId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11' && activeTab === 'editor') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);



  useEffect(() => {
    if (!autoDetectEnabled || !code || code === originalCode) return;

    const timer = setTimeout(() => {
      if (code.length > 50) {
        const patterns = [
          /process\.env\.([A-Z_][A-Z0-9_]*)/g,
          /process\.env\[['"`]([A-Z_][A-Z0-9_]*)['"`]\]/g,
          /process\.env\[`([A-Z_][A-Z0-9_]*)`\]/g,
          /process\.env\[([A-Z_][A-Z0-9_]*)\]/g,
        ];

        const detectedVars = new Set();
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(code)) !== null) {
            const varName = match[1];
            if (varName && varName.length > 0) {
              detectedVars.add(varName);
            }
          }
        });

        const commonBuiltins = ['NODE_ENV', 'PATH', 'HOME', 'USER', 'PWD', 'SHELL', 'LANG', 'TZ'];
        const newVars = Array.from(detectedVars)
          .filter(varName => !commonBuiltins.includes(varName) && varName.length > 1)
          .filter(varName => !environmentVariables.some(existing => existing.key === varName));

        if (newVars.length > 0) {
          const envVarsToAdd = newVars.map(varName => {
            const secretKeywords = ['token', 'secret', 'key', 'password', 'pass', 'auth', 'private'];
            const isSecret = secretKeywords.some(keyword => varName.toLowerCase().includes(keyword));
            
            let defaultValue = '';
            if (varName === 'BOT_TOKEN' || varName === 'TOKEN') {
              defaultValue = bot?.token || '';
            } else if (varName === 'NODE_ENV') {
              defaultValue = 'production';
            } else if (varName === 'PORT') {
              defaultValue = '3000';
            } else if (varName === 'BOT_MODE') {
              defaultValue = 'polling';
            }

            return { key: varName, value: defaultValue, isSecret };
          });

          setEnvironmentVariables(prev => [...prev, ...envVarsToAdd]);
          toast.success(`Auto-detected ${envVarsToAdd.length} new environment variables`);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, autoDetectEnabled, environmentVariables, originalCode, bot?.token]);

  const loadBotData = async () => {
    setLoading(true);
    try {
      let currentBot = bots.find(b => b.id === botId);
      
      if (!currentBot) {
        currentBot = await getBot(botId);
      }
      
      if (currentBot) {
        setBot(currentBot);
        
        // Load bot code
        const fileData = await getBotFile(botId);
        const botCode = fileData.content || '';
        setCode(botCode);
        setOriginalCode(botCode);
        

        
        if (currentBot.environmentVariables && Array.isArray(currentBot.environmentVariables)) {
          const referencesProtect = /process\.env\.PROTECT_CONTENT|process\.env\[['"`]PROTECT_CONTENT['"`]\]/.test(botCode);
          const filtered = referencesProtect
            ? currentBot.environmentVariables
            : currentBot.environmentVariables.filter(v => v.key !== 'PROTECT_CONTENT');
          setEnvironmentVariables(filtered);
        } else {
          setEnvironmentVariables([
            { key: 'BOT_TOKEN', value: currentBot.token || '', isSecret: true },
            { key: 'NODE_ENV', value: 'production', isSecret: false },
            { key: 'BOT_MODE', value: 'polling', isSecret: false }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load bot data:', error);
      toast.error('Failed to load bot data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (code === originalCode) return;
    
    setSaving(true);
    try {
      await updateBotFile(botId, code);
      setOriginalCode(code);
      toast.success('Code saved successfully!');
    } catch (error) {
      console.error('Failed to save code:', error);
      toast.error('Failed to save code');
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    try {
      await updateBot(botId, { environmentVariables });
      
      setBot(prevBot => ({ ...prevBot, status: 'starting' }));
      await startBot(botId);
    } catch (error) {
      console.error('Failed to start bot:', error);
      toast.error('Failed to start bot');
      setBot(prevBot => ({ ...prevBot, status: 'stopped' }));
    }
  };

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop this bot?')) {
      try {
        setBot(prevBot => ({ ...prevBot, status: 'stopping' }));
        await stopBot(botId);
      } catch (error) {
        console.error('Failed to stop bot:', error);
        toast.error('Failed to stop bot');
        setBot(prevBot => ({ ...prevBot, status: 'running' }));
      }
    }
  };

  const handleRestart = async () => {
    try {
      await handleStop();
      setTimeout(async () => {
        await handleStart();
      }, 1000);
    } catch (error) {
      console.error('Failed to restart bot:', error);
      toast.error('Failed to restart bot');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      try {
        await deleteBot(botId);
        // Navigate back to dashboard after deletion
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to delete bot:', error);
        toast.error('Failed to delete bot');
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getLanguage = () => {
    return 'javascript';
  };

  const getStatusBadge = () => {
    if (!bot) return null;
    
    const statusColors = {
      running: 'bg-green-100 text-green-800',
      stopped: 'bg-gray-100 text-gray-800',
      starting: 'bg-yellow-100 text-yellow-800',
      stopping: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[bot.status] || statusColors.stopped}`}>
        <Activity size={12} className="mr-1" />
        {bot.status || 'stopped'}
      </span>
    );
  };

  const addEnvironmentVariable = () => {
    try {
      setEnvironmentVariables([...environmentVariables, { key: '', value: '', isSecret: false }]);
    } catch (error) {
      console.error('Error adding environment variable:', error);
      toast.error('Failed to add environment variable');
    }
  };

  const removeEnvironmentVariable = (index) => {
    try {
      setEnvironmentVariables(environmentVariables.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing environment variable:', error);
      toast.error('Failed to remove environment variable');
    }
  };

  const updateEnvironmentVariable = (index, field, value) => {
    try {
      const updated = [...environmentVariables];
      updated[index] = { ...updated[index], [field]: value };
      setEnvironmentVariables(updated);
    } catch (error) {
      console.error('Error updating environment variable:', error);
      toast.error('Failed to update environment variable');
    }
  };

  const saveEnvironmentVariables = async () => {
    try {
      await updateBot(botId, { environmentVariables });
      toast.success('Environment variables saved!');
    } catch (error) {
      console.error('Failed to save environment variables:', error);
      toast.error('Failed to save environment variables');
    }
  };

  const autoFillEnvironmentVariables = () => {
    const defaultVars = [
      { key: 'BOT_TOKEN', value: bot?.token || '', isSecret: true },
      { key: 'NODE_ENV', value: 'production', isSecret: false },
      { key: 'BOT_MODE', value: 'polling', isSecret: false },
      { key: 'PORT', value: '3000', isSecret: false },
      { key: 'LOG_LEVEL', value: 'info', isSecret: false },
      { key: 'DEBUG', value: 'false', isSecret: false },
      { key: 'WEBHOOK_URL', value: '', isSecret: false },
      { key: 'WEBHOOK_SECRET', value: '', isSecret: true }
    ];
    
    const existingKeys = environmentVariables.map(v => v.key);
    const newVars = defaultVars.filter(v => !existingKeys.includes(v.key));
    
    setEnvironmentVariables([...environmentVariables, ...newVars]);
    toast.success('Default environment variables added!');
  };

  const detectEnvironmentVariablesFromCode = () => {
    if (!code) {
      toast.error('No code to analyze');
      return;
    }

    const patterns = [
      /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      /process\.env\[['"`]([A-Z_][A-Z0-9_]*)['"`]\]/g,
      /process\.env\[`([A-Z_][A-Z0-9_]*)`\]/g,
      /process\.env\[([A-Z_][A-Z0-9_]*)\]/g,
      /process\.env\.([a-z][a-z0-9_]*)/g,
      /process\.env\[['"`]([a-z][a-z0-9_]*)['"`]\]/g,
      /process\.env\[`([a-z][a-z0-9_]*)`\]/g,
      /process\.env\[([a-z][a-z0-9_]*)\]/g,
      /process\.env\.([A-Za-z][A-Za-z0-9_]*)/g,
      /process\.env\[['"`]([A-Za-z][A-Za-z0-9_]*)['"`]\]/g,
      /process\.env\[`([A-Za-z][A-Za-z0-9_]*)`\]/g,
      /process\.env\[([A-Za-z][A-Za-z0-9_]*)\]/g,
    ];

    const detectedVars = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const varName = match[1];
        if (varName && varName.length > 0) {
          detectedVars.add(varName);
        }
      }
    });

    const commonBuiltins = ['NODE_ENV', 'PATH', 'HOME', 'USER', 'PWD', 'SHELL', 'LANG', 'TZ'];
    const filteredVars = Array.from(detectedVars)
      .filter(varName => !commonBuiltins.includes(varName) && varName.length > 1);

    if (filteredVars.length === 0) {
      toast.error('No environment variables detected in code');
      return;
    }

    const newVars = filteredVars.map(varName => {
      const secretKeywords = ['token', 'secret', 'key', 'password', 'pass', 'auth', 'private'];
      const isSecret = secretKeywords.some(keyword => 
        varName.toLowerCase().includes(keyword)
      );
      
      let defaultValue = '';
      if (varName === 'BOT_TOKEN' || varName === 'TOKEN') {
        defaultValue = bot?.token || '';
      } else if (varName === 'NODE_ENV') {
        defaultValue = 'production';
      } else if (varName === 'PORT') {
        defaultValue = '3000';
      } else if (varName === 'BOT_MODE') {
        defaultValue = 'polling';
      }

      return {
        key: varName,
        value: defaultValue,
        isSecret: isSecret
      };
    });

    const existingKeys = environmentVariables.map(v => v.key);
    const uniqueNewVars = newVars
      .filter(v => !existingKeys.includes(v.key));
    
    if (uniqueNewVars.length === 0) {
      toast.info('All detected environment variables already exist');
      return;
    }

    setEnvironmentVariables([...environmentVariables, ...uniqueNewVars]);
    toast.success(`Detected and added ${uniqueNewVars.length} environment variables from code!`);
  };

  const clearErrors = () => {
    setErrors([]);
    toast.success('Errors cleared');
  };

  const copyError = (error) => {
    navigator.clipboard.writeText(error);
    toast.success('Error copied to clipboard');
  };

  const formatError = (error) => {
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error, null, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">There was an error loading the bot editor.</p>
        <Link to="/" className="btn-primary">
          Back to Dashboard
        </Link>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm sm:text-base">
              ← Back
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{bot.name}</h1>
            {getStatusBadge()}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {/* First row: Start/Stop, Restart */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {bot.status === 'running' ? (
              <button onClick={handleStop} className="btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                <Square size={14} />
                <span className="ml-1">Stop</span>
              </button>
            ) : (
              <button onClick={handleStart} className="btn-success text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                <Play size={14} />
                <span className="ml-1">Start</span>
              </button>
            )}
            
            <button onClick={handleRestart} className="btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <RotateCcw size={14} />
              <span className="ml-1">Restart</span>
            </button>
          </div>
          
          {/* Second row: Save, Delete */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handleSave}
              disabled={saving || code === originalCode}
              className="btn-primary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Save size={14} />
              <span className="ml-1">{saving ? 'Saving...' : 'Save'}</span>
            </button>
            
            <button
              onClick={handleDelete}
              className="btn-danger text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Trash2 size={14} />
              <span className="ml-1">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={14} className="inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Code Editor</span>
            <span className="sm:hidden">Code</span>
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'environment'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings size={14} className="inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Environment Variables</span>
            <span className="sm:hidden">Env</span>
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'errors'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle size={14} className="inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Errors ({errors.length})</span>
            <span className="sm:hidden">Errors ({errors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings size={14} className="inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'editor' && (
        <div className={`card ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
          <div className={`${isFullscreen ? 'h-full' : 'h-80 sm:h-[500px]'} overflow-hidden relative`}>
            {/* Fullscreen toggle button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 right-2 z-10 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>


            {isAndroid ? (
              <textarea
                className="w-full h-full p-4 bg-gray-900 text-white font-mono text-sm outline-none resize-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
            ) : (
              <Editor
                height="100%"
                language={getLanguage()}
                value={code}
                onChange={setCode}
                theme="vs-dark"
                onMount={(editor, monaco) => {
                  setEditorInstance(editor);
                  // Focus editor when loaded
                  setTimeout(() => {
                    editor.focus();
                  }, 100);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: true,
                  automaticLayout: true,
                  wordWrap: 'off',
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 12,
                    horizontalScrollbarSize: 12,
                    useShadows: true,
                  },
                  overviewRulerBorder: true,
                  overviewRulerLanes: 3,
                  fixedOverflowWidgets: true,
                  renderWhitespace: 'selection',
                  renderControlCharacters: false,
                  renderLineHighlight: 'all',
                  selectOnLineNumbers: false,
                  glyphMargin: true,
                  useTabStops: false,
                  insertSpaces: true,
                  tabSize: 2,
                  detectIndentation: true,
                  trimAutoWhitespace: true,
                  largeFileOptimizations: true,
                  parameterHints: {
                    enabled: true,
                    cycle: true,
                  },
                  autoIndent: 'full',
                  formatOnPaste: true,
                  formatOnType: true,
                  // Enable keyboard shortcuts
                  multiCursorModifier: 'alt',
                  accessibilitySupport: 'on',
                  copyWithSyntaxHighlighting: true,
                  // Mobile-friendly text selection
                  selectionClipboard: false,
                  contextmenu: true,
                  // Mobile text selection improvements
                  mouseWheelZoom: false,
                  disableLayerHinting: true,
                  // Disable features that interfere with text selection
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false,
                  acceptSuggestionOnCommitCharacter: false,
                  acceptSuggestionOnEnter: 'off'
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'environment' && (
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Environment Variables</h3>
              <p className="text-xs sm:text-sm text-gray-600">Configure environment variables for your bot</p>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="autoDetect"
                  checked={autoDetectEnabled}
                  onChange={(e) => setAutoDetectEnabled(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="autoDetect" className="ml-2 block text-xs sm:text-sm text-gray-700">
                  Auto-detect variables from code changes
                </label>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                className="btn-secondary text-xs px-2 py-1.5"
              >
                {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="ml-1">{showSecrets ? 'Hide' : 'Show'}</span>
              </button>
              <button
                onClick={detectEnvironmentVariablesFromCode}
                className="btn-secondary text-xs px-2 py-1.5"
              >
                <FileText size={14} />
                <span className="ml-1 hidden sm:inline">Detect</span>
              </button>
              <button
                onClick={autoFillEnvironmentVariables}
                className="btn-secondary text-xs px-2 py-1.5"
              >
                <RefreshCw size={14} />
                <span className="ml-1 hidden sm:inline">Auto-fill</span>
              </button>
              <button
                onClick={addEnvironmentVariable}
                className="btn-primary text-xs px-2 py-1.5"
              >
                <Plus size={14} />
                <span className="ml-1">Add</span>
              </button>
            </div>
          </div>

          {/* Help Information */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">💡 Bot Mode Information</h4>
            <div className="text-xs sm:text-sm text-blue-800 space-y-1 sm:space-y-2">
              <div>
                <p className="font-medium">📡 Polling Mode (Default):</p>
                <p>• Bot continuously checks for new messages</p>
                <p>• May receive queued messages when restarted</p>
                <p>• Works on any hosting platform</p>
                <p>• Set <code className="bg-blue-100 px-1 rounded">BOT_MODE=polling</code></p>
              </div>
              <div>
                <p className="font-medium">🌐 Webhook Mode:</p>
                <p>• Telegram sends messages directly to your bot</p>
                <p>• No message queuing, instant responses</p>
                <p>• Requires HTTPS endpoint and public URL</p>
                <p>• Set <code className="bg-blue-100 px-1 rounded">BOT_MODE=webhook</code> and <code className="bg-blue-100 px-1 rounded">WEBHOOK_URL=https://your-domain.com/webhook</code></p>
              </div>
              <div>
                <p className="font-medium">🛡️ Message Deduplication:</p>
                <p>• Automatically prevents duplicate responses</p>
                <p>• Built-in rate limiting (100ms between messages)</p>
                <p>• Memory management (keeps last 1000 processed messages)</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {environmentVariables.map((envVar, index) => {
              // Check if this variable is used in the current code
              const isUsedInCode = code && (
                code.includes(`process.env.${envVar.key}`) ||
                code.includes(`process.env['${envVar.key}']`) ||
                code.includes(`process.env["${envVar.key}"]`) ||
                code.includes(`process.env[\`${envVar.key}\`]`)
              );

              return (
                <div key={index} className={`flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 border rounded-lg ${
                  isUsedInCode ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Variable name (e.g., API_KEY)"
                          value={envVar.key}
                          onChange={(e) => updateEnvironmentVariable(index, 'key', e.target.value)}
                          className="input text-xs sm:text-sm"
                          list={`env-var-${index}`}
                        />
                        <datalist id={`env-var-${index}`}>
                          {commonEnvVars.map((suggestion, idx) => (
                            <option key={idx} value={suggestion} />
                          ))}
                        </datalist>
                      </div>
                      {isUsedInCode && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Used in code
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <input
                        type={showSecrets || !envVar.isSecret ? "text" : "password"}
                        placeholder="Variable value"
                        value={envVar.value}
                        onChange={(e) => updateEnvironmentVariable(index, 'value', e.target.value)}
                        className="input flex-1 text-xs sm:text-sm"
                      />
                      <button
                        onClick={() => updateEnvironmentVariable(index, 'isSecret', !envVar.isSecret)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md ${
                          envVar.isSecret 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {envVar.isSecret ? 'Secret' : 'Public'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEnvironmentVariable(index)}
                    className="text-red-600 hover:text-red-800 p-2 self-start sm:self-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveEnvironmentVariables}
              className="btn-primary"
            >
              <Save size={16} />
              Save Environment Variables
            </button>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Bot Errors</h3>
              <p className="text-xs sm:text-sm text-gray-600">Real-time error logs and debugging information</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearErrors}
                className="btn-secondary text-xs px-2 py-1.5"
              >
                <RefreshCw size={14} />
                <span className="ml-1">Clear</span>
              </button>
            </div>
          </div>

          {errors.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Errors</h3>
              <p className="text-gray-600">Your bot is running without any errors!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Error #{index + 1}
                      </span>
                      <span className="text-xs text-red-600">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() => copyError(formatError(error))}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Copy error"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <pre className="text-sm text-red-700 bg-red-100 p-3 rounded overflow-x-auto">
                    {formatError(error)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Bot Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={bot.name}
                  onChange={(e) => setBot({ ...bot, name: e.target.value })}
                  className="input mt-1 text-xs sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Token</label>
                <input
                  type="password"
                  value={bot.token}
                  onChange={(e) => setBot({ ...bot, token: e.target.value })}
                  className="input mt-1 text-xs sm:text-sm"
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
                <label htmlFor="autoStart" className="ml-2 block text-xs sm:text-sm text-gray-900">
                  Auto-start on platform launch
                </label>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <button
                onClick={async () => {
                  try {
                    await updateBot(botId, {
                      name: bot.name,
                      token: bot.token,
                      autoStart: bot.autoStart
                    });
                    toast.success('Bot settings saved!');
                  } catch (error) {
                    console.error('Failed to update bot:', error);
                    toast.error('Failed to save bot settings');
                  }
                }}
                className="btn-primary text-xs sm:text-sm px-3 py-2"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Bot Status</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotEditor;