import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from '../hooks/useAuth';
import notificationService from '../services/notificationService';
import type { Notification } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { socket, connected, on, off } = useSocket();
  const { user } = useAuth();
  
  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Bildirimi okundu olarak işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // State'i güncelle
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Okunmamış sayısını güncelle
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    }
  };
  
  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Tüm bildirimleri okundu olarak işaretle
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      
      // Okunmamış sayısını sıfırla
      setUnreadCount(0);
    } catch (error) {
      console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
    }
  };
  
  // Yeni bildirim geldiğinde
  const handleNewNotification = useCallback((notification: Notification) => {
    // Bildirimi listeye ekle
    setNotifications(prev => [notification, ...prev]);
    
    // Okunmamış sayısını artır
    setUnreadCount(prev => prev + 1);
    
    // Tarayıcı bildirimi göster
    if (Notification.permission === 'granted') {
      const title = notification.title;
      const options = {
        body: notification.message,
        icon: '/logo.png'
      };
      
      new Notification(title, options);
    }
  }, []);
  
  // Socket.io dinleyicilerini kur
  useEffect(() => {
    if (connected && socket) {
      // Yeni bildirim geldiğinde
      on('notification', handleNewNotification);
      
      // Temizleme işlevi
      return () => {
        off('notification', handleNewNotification);
      };
    }
  }, [connected, socket, on, off, handleNewNotification]);
  
  // İlk yükleme
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Tarayıcı bildirimlerine izin iste
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [user, loadNotifications]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};