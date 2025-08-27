import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { BotProvider } from './contexts/BotContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BotEditor from './pages/BotEditor';
import BotLogs from './pages/BotLogs';
import BotErrors from './pages/BotErrors';
import Settings from './pages/Settings';

function App() {
  return (
    <SocketProvider>
      <BotProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bot/:botId" element={<BotEditor />} />
            <Route path="/bot/:botId/logs" element={<BotLogs />} />
            <Route path="/bot/:botId/errors" element={<BotErrors />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BotProvider>
    </SocketProvider>
  );
}

export default App;