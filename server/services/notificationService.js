const Notification = require('../models/Notification');
const socketIo = require('socket.io');

// Bildirim oluştur
const createNotification = async (recipientId, type, title, message, relatedListing = null, relatedBid = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedListing,
      relatedBid,
      isRead: false,
      createdAt: new Date()
    });
    
    await notification.save();
    
    // Global Socket.IO nesnesi varsa ilgili kullanıcıya bildirim gönder
    if (global.io) {
      global.io.to(`user_${recipientId}`).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedListing: notification.relatedListing,
        relatedBid: notification.relatedBid,
        createdAt: notification.createdAt,
        isRead: notification.isRead
      });
    }
    
    return notification;
  } catch (error) {
    console.error('Bildirim oluşturulurken hata:', error);
    throw error;
  }
};

// Kullanıcının tüm bildirimlerini getir
const getUserNotifications = async (userId, limit = 20, skip = 0) => {
  try {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedListing', 'title')
      .lean();
    
    return notifications;
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    throw error;
  }
};

// Okunmamış bildirim sayısını getir
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: userId,
      isRead: false
    });
    
    return count;
  } catch (error) {
    console.error('Okunmamış bildirim sayısı alınırken hata:', error);
    throw error;
  }
};

// Bildirimi okundu olarak işaretle
const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    throw error;
  }
};

// Tüm bildirimleri okundu olarak işaretle
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    
    return result;
  } catch (error) {
    console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
}; 