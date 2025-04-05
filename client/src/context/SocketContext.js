import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Bağlantıyı kur
    const setupSocket = () => {
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket.io bağlantısı kuruldu');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket.io bağlantısı kesildi');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket.io bağlantı hatası:', error);
        setConnected(false);
      });

      setSocket(socketInstance);

      return socketInstance;
    };

    // Kimlik doğrulama yapıldığında soketi oluştur
    let socketInstance = null;
    if (isAuthenticated && user) {
      socketInstance = setupSocket();
    }

    // Temizleme
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Dinleyici eklemek için yardımcı fonksiyon
  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Dinleyici kaldırmak için yardımcı fonksiyon
  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Event göndermek için yardımcı fonksiyon
  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
}; 