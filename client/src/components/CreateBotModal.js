import React, { useState, useEffect } from 'react';
import { X, Bot, Code, FileCode } from 'lucide-react';
import { useBots } from '../contexts/BotContext';

const CreateBotModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    code: '',
    autoStart: false
  });
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { createBot, getSupportedLanguages } = useBots();

  useEffect(() => {}, [isOpen]);

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
      <div className="flex min-h-full items-end justify-center p-2 text-center sm:items-center sm:p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                Create New Bot
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
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

              {/* Language removed: JavaScript only */}

              {/* Initial Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Initial Code (Optional)
                </label>
                <textarea
                  id="code"
                  rows={6}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="textarea mt-1 font-mono text-xs sm:text-sm"
                  placeholder="// Your bot code here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use the default boilerplate code
                </p>
              </div>

              {/* Auto Start removed for simplicity */}
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 flex flex-col-reverse sm:flex-row sm:flex-row-reverse sm:px-6 gap-2">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.token}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm py-2.5"
            >
              {loading ? 'Creating...' : 'Create Bot'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto text-sm py-2.5 sm:mr-3"
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