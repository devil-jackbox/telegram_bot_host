import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : (process.env.REACT_APP_API_URL || 'http://localhost:3001');
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    newSocket.on('bot-status', (data) => {
      console.log('Bot status update:', data);
    });

    newSocket.on('bot-log', (data) => {
      console.log('Bot log:', data);
    });

    newSocket.on('bot-error', (data) => {
      console.error('Bot error:', data);
    });

    setSocket(newSocket);
    window.socket = newSocket;

    return () => {
      newSocket.close();
    };
  }, []);

  const joinBotRoom = (botId) => {
    if (socket && isConnected) {
      socket.emit('join-bot-room', botId);
    }
  };

  const leaveBotRoom = (botId) => {
    if (socket && isConnected) {
      socket.emit('leave-bot-room', botId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinBotRoom,
    leaveBotRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};