import React, { useState, useEffect } from 'react';
import { X, Bot, Code, FileCode } from 'lucide-react';
import { useBots } from '../contexts/BotContext';

const CreateBotModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    language: 'javascript',
    code: '',
    autoStart: false
  });
  const [languages, setLanguages] = useState([{ id: 'javascript', name: 'JavaScript', extension: 'js' }]);
  const [loading, setLoading] = useState(false);
  const { createBot, getSupportedLanguages } = useBots();

  useEffect(() => {
    // Languages fixed to JavaScript only
    setLanguages([{ id: 'javascript', name: 'JavaScript', extension: 'js' }]);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createBot(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      token: '',
      language: 'javascript',
      code: '',
      autoStart: false
    });
    onClose();
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <Code size={16} />;
      case 'python':
        return <Bot size={16} />;
      default:
        return <FileCode size={16} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Create New Bot
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bot Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Bot Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                  placeholder="My Awesome Bot"
                />
              </div>

              {/* Bot Token */}
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Bot Token
                </label>
                <input
                  type="password"
                  id="token"
                  required
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="input mt-1"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>

              {/* Programming Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Programming Language
                </label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="input mt-1"
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Initial Code (Optional)
                </label>
                <textarea
                  id="code"
                  rows={8}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="textarea mt-1 font-mono text-sm"
                  placeholder="// Your bot code here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use the default boilerplate code
                </p>
              </div>

              {/* Auto Start */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={formData.autoStart}
                  onChange={(e) => setFormData({ ...formData, autoStart: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="autoStart" className="ml-2 block text-sm text-gray-900">
                  Start bot automatically after creation
                </label>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.token}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Bot'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary mt-3 sm:mt-0 sm:mr-3"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBotModal;