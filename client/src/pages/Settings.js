import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Shield, 
  Database,
  Info,
  Save
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    maxBots: 10,
    maxLogsPerBot: 1000,
    maxErrorsPerBot: 100,
    autoRestartOnError: true,
    logRetentionDays: 30,
    enableNotifications: true
  });

  const handleSave = () => {
    // Save settings logic would go here
    console.log('Saving settings:', settings);
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
                onChange={(e) => setSettings({ ...settings, maxBots: parseInt(e.target.value) })}
                className="input mt-1"
                min="1"
                max="50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Logs per Bot
              </label>
              <input
                type="number"
                value={settings.maxLogsPerBot}
                onChange={(e) => setSettings({ ...settings, maxLogsPerBot: parseInt(e.target.value) })}
                className="input mt-1"
                min="100"
                max="10000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Errors per Bot
              </label>
              <input
                type="number"
                value={settings.maxErrorsPerBot}
                onChange={(e) => setSettings({ ...settings, maxErrorsPerBot: parseInt(e.target.value) })}
                className="input mt-1"
                min="50"
                max="1000"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Log Retention (days)
              </label>
              <input
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
                className="input mt-1"
                min="1"
                max="365"
              />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Info size={20} className="text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">System Information</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Node.js Version</span>
              <span className="text-gray-900">18.x</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Supported Languages</span>
              <span className="text-gray-900">6</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bots</span>
              <span className="text-gray-900">0</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Running Bots</span>
              <span className="text-gray-900">0</span>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Database size={20} className="text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
          </div>
          
          <div className="space-y-4">
            <button className="btn-secondary w-full">
              Export All Bots
            </button>
            
            <button className="btn-secondary w-full">
              Import Bots
            </button>
            
            <button className="btn-danger w-full">
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary"
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;