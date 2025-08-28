import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Shield, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    maxBots: 10,
    maxLogsPerBot: 1000,
    maxErrorsPerBot: 100,
    autoRestartOnError: true,
    logRetentionDays: 30,
    enableNotifications: true,
    autoIdleTimeout: 30, // minutes
    maxConcurrentBots: 2
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('platformSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('platformSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(parsed));
    } else {
      setHasChanges(true);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('platformSettings', JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      maxBots: 10,
      maxLogsPerBot: 1000,
      maxErrorsPerBot: 100,
      autoRestartOnError: true,
      logRetentionDays: 30,
      enableNotifications: true,
      autoIdleTimeout: 30,
      maxConcurrentBots: 2
    };
    setSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your bot hosting platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Settings */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Server size={20} className="text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Platform Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Bots per User
              </label>
              <input
                type="number"
                value={settings.maxBots}
                onChange={(e) => setSettings({ ...settings, maxBots: parseInt(e.target.value) || 1 })}
                className="input mt-1"
                min="1"
                max="20"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 5-10 for free plan</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Logs per Bot
              </label>
              <input
                type="number"
                value={settings.maxLogsPerBot}
                onChange={(e) => setSettings({ ...settings, maxLogsPerBot: parseInt(e.target.value) || 100 })}
                className="input mt-1"
                min="100"
                max="5000"
              />
              <p className="text-xs text-gray-500 mt-1">Older logs are automatically purged</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Errors per Bot
              </label>
              <input
                type="number"
                value={settings.maxErrorsPerBot}
                onChange={(e) => setSettings({ ...settings, maxErrorsPerBot: parseInt(e.target.value) || 50 })}
                className="input mt-1"
                min="50"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">Error history is limited to save memory</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Concurrent Running Bots
              </label>
              <input
                type="number"
                value={settings.maxConcurrentBots}
                onChange={(e) => setSettings({ ...settings, maxConcurrentBots: parseInt(e.target.value) || 1 })}
                className="input mt-1"
                min="1"
                max="5"
              />
              <p className="text-xs text-gray-500 mt-1">Prevents overloading Railway's free plan</p>
            </div>
          </div>
        </div>

        {/* Security & Performance */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Shield size={20} className="text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Security & Performance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRestartOnError"
                checked={settings.autoRestartOnError}
                onChange={(e) => setSettings({ ...settings, autoRestartOnError: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRestartOnError" className="ml-2 block text-sm text-gray-900">
                Auto-restart bots on error
              </label>
              <p className="text-xs text-gray-500 ml-6">Automatically restart crashed bots</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableNotifications"
                checked={settings.enableNotifications}
                onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-900">
                Enable browser notifications
              </label>
              <p className="text-xs text-gray-500 ml-6">Get notified when bots start/stop</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Log Retention (days)
              </label>
              <input
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) || 1 })}
                className="input mt-1"
                min="1"
                max="90"
              />
              <p className="text-xs text-gray-500 mt-1">Logs older than this are deleted</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Auto-idle Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.autoIdleTimeout}
                onChange={(e) => setSettings({ ...settings, autoIdleTimeout: parseInt(e.target.value) || 30 })}
                className="input mt-1"
                min="5"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">Stop bots after inactivity to save resources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReset}
          className="btn-secondary"
        >
          Reset to Defaults
        </button>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle size={16} className="mr-1" />
              Unsaved changes
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`btn-primary ${(!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;