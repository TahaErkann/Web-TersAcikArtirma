const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Tüm kategorileri getir (genel erişim)
router.get('/', categoryController.getAllCategories);

// Kategori detayını getir (genel erişim)
router.get('/:id', categoryController.getCategoryById);

// Admin: Yeni kategori oluştur
router.post('/', authenticateToken, isAdmin, categoryController.createCategory);

// Admin: Kategori güncelle
router.put('/:id', authenticateToken, isAdmin, categoryController.updateCategory);

// Admin: Kategori sil
router.delete('/:id', authenticateToken, isAdmin, categoryController.deleteCategory);

module.exports = router; 