const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Tüm rotalar auth middleware'i gerektirir
router.use(authenticateToken);

// Kullanıcının bildirimlerini getir
router.get('/', notificationController.getUserNotifications);

// Okunmamış bildirim sayısını getir
router.get('/unread-count', notificationController.getUnreadCount);

// Bildirimi okundu olarak işaretle
router.put('/:notificationId/read', notificationController.markAsRead);

// Tüm bildirimleri okundu olarak işaretle
router.put('/mark-all-read', notificationController.markAllAsRead);

module.exports = router; 