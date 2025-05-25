const express = require('express');
const router = express.Router();
const { 
  getAllCategories, 
  getAllCategoriesForAdmin,
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { uploadCategoryImage } = require('../middleware/upload');

// Genel kategoriler (aktif olanlar)
router.get('/', getAllCategories);

// Admin: Tüm kategoriler (aktif/pasif tümü)
router.get('/admin', authenticateToken, isAdmin, getAllCategoriesForAdmin);

// Kategori detayı
router.get('/:id', getCategoryById);

// Admin: Yeni kategori oluştur
router.post('/', authenticateToken, isAdmin, uploadCategoryImage, createCategory);

// Admin: Kategori güncelle
router.put('/:id', authenticateToken, isAdmin, uploadCategoryImage, updateCategory);

// Admin: Kategori sil
router.delete('/:id', authenticateToken, isAdmin, deleteCategory);

module.exports = router; 