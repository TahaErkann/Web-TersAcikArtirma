const notificationService = require('../services/notificationService');

// Kullanıcı bildirimlerini getir
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // MongoDB'de _id kullanılıyor
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const notifications = await notificationService.getUserNotifications(userId, limit, skip);
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          hasMore: notifications.length === limit
        }
      }
    });
  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Okunmamış bildirim sayısını getir
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id; // MongoDB'de _id kullanılıyor
    const count = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Okunmamış bildirim sayısı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Okunmamış bildirim sayısı alınırken bir hata oluştu',
      error: error.message
    });
  }
};

// Bildirimi okundu olarak işaretle
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim okundu olarak işaretlenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Tüm bildirimleri okundu olarak işaretle
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // MongoDB'de _id kullanılıyor
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi',
      data: result
    });
  } catch (error) {
    console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tüm bildirimler okundu olarak işaretlenirken bir hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
}; 