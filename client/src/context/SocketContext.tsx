import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SocketContextType } from '../types';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // Bağlantıyı kur
    const setupSocket = () => {
      const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
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

    // Socket bağlantısını kur
    let socketInstance: Socket | null = null;
    if (user) {
      socketInstance = setupSocket();
    }

    // Temizleme
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  // Dinleyici eklemek için yardımcı fonksiyon
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  // Dinleyici kaldırmak için yardımcı fonksiyon
  const off = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Event göndermek için yardımcı fonksiyon
  const emit = (event: string, data: any) => {
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