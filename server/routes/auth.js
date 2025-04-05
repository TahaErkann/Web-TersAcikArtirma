const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Kullanıcı kaydı
router.post('/register', authController.register);

// Kullanıcı girişi
router.post('/login', authController.login);

// Mevcut kullanıcıyı getir
router.get('/me', authenticateToken, authController.getCurrentUser);

// Profil bilgilerini güncelle
router.put('/profile', authenticateToken, authController.updateProfile);

// Admin: Tüm kullanıcıları listele
router.get('/users', authenticateToken, isAdmin, authController.listUsers);

// Admin: Firma onaylama
router.put('/users/:userId/approve', authenticateToken, isAdmin, authController.approveUser);

// Admin: Firma reddetme
router.put('/users/:userId/reject', authenticateToken, isAdmin, authController.rejectUser);

module.exports = router; 