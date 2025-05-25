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
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    let socketInstance: Socket | null = null;
    
    const setupSocket = () => {
      // API URL'i ortam değişkeninden veya varsayılan değerden al  
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      // Socket.io için /api namespace'ini kullanma
      const SOCKET_URL = BASE_URL.replace('/api', '');
      console.log('Socket.io bağlantısı başlatılıyor:', SOCKET_URL);
      
      try {
        // Socket.io bağlantısını oluştur
        socketInstance = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 5000,
          auth: {
            token: token
          }
        });

        // Bağlantı durumunu dinle
        socketInstance.on('connect', () => {
          console.log('Socket.io bağlantısı kuruldu');
          setConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log(`Socket.io bağlantısı kesildi: ${reason}`);
          setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.io bağlantı hatası:', error);
          setConnected(false);
        });

        setSocket(socketInstance);
        return socketInstance;
      } catch (error) {
        console.error('Socket.io başlatma hatası:', error);
        setConnected(false);
        return null;
      }
    };

    // Kullanıcı ve token varsa bağlantı kur
    if (user && token) {
      socketInstance = setupSocket();
    }

    // Temizleme işlevi
    return () => {
      if (socketInstance) {
        console.log('Socket.io bağlantısı kapatılıyor');
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [user, token]);

  // Olay dinleyicisi ekle
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    } else {
      console.warn(`Socket bağlantısı olmadan "${event}" olayı dinlenemedi.`);
    }
  };

  // Olay dinleyicisi kaldır
  const off = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Olay gönder
  const emit = (event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    } else {
      console.warn(`Socket bağlantısı olmadan "${event}" olayı gönderilemedi.`);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, on, off, emit }}>
      {children}
    </SocketContext.Provider>
  );
}; 