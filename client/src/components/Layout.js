import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bot, 
  Home, 
  Settings, 
  Menu, 
  X, 
  Code,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useBots } from '../contexts/BotContext';
import CreateBotModal from './CreateBotModal';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const location = useLocation();
  const { bots } = useBots();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 sm:w-80 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Bot Platform</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <X size={20} />
            </button>
          </div>
          <SidebarContent 
            navigation={navigation} 
            bots={bots} 
            isActive={isActive}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">Bot Platform</h1>
          </div>
          <SidebarContent 
            navigation={navigation} 
            bots={bots} 
            isActive={isActive}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-2 border-b border-gray-200 bg-white px-3 shadow-sm sm:gap-x-4 sm:px-4 lg:px-6">
          <button
            type="button"
            className="-m-2 p-2 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center justify-between w-full">
            <div className="w-6 sm:w-8"></div>
            <div className="flex items-center justify-center flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">TeleBot Host</h1>
            </div>
            <div className="w-6 sm:w-8 flex justify-end">
              <div className="p-1.5 sm:p-2 bg-primary-100 rounded-lg">
                <Bot size={16} className="sm:w-5 sm:h-5 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Create bot modal */}
      <CreateBotModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

const SidebarContent = ({ navigation, bots, isActive, onClose }) => {
  const getBotIcon = (language) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <Code size={16} />;
      case 'python':
        return <Bot size={16} />;
      default:
        return <Bot size={16} />;
    }
  };

  const getBotStatusIcon = (bot) => {
    if (bot.status === 'running') {
      return <Activity size={12} className="text-green-500" />;
    }
    if (bot.status === 'error') {
      return <AlertTriangle size={12} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-grow overflow-y-auto">
      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className="mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bots section */}
      <div className="border-t border-gray-200 p-3 sm:p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Your Bots ({bots.length})
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              to={`/bot/${bot.id}`}
              onClick={onClose}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(`/bot/${bot.id}`)
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center mr-2 sm:mr-3">
                {getBotIcon(bot.language)}
                {getBotStatusIcon(bot)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs sm:text-sm">{bot.name}</p>
                <p className="text-xs text-gray-400 capitalize">{bot.language}</p>
              </div>
            </Link>
          ))}
          {bots.length === 0 && (
            <div className="text-xs sm:text-sm text-gray-500 px-2 py-2">
              No bots yet. Create your first bot!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;