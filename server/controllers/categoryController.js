const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// Tüm kategorileri getir
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Tüm kategorileri getir (aktif/pasif tümü)
exports.getAllCategoriesForAdmin = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kategori detayını getir
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Yeni kategori oluştur
exports.createCategory = async (req, res) => {
  try {
    console.log('createCategory çağrıldı');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const { name, description, icon } = req.body;
    
    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten var' });
    }

    // Resim yüklendi mi kontrol et
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/categories/${req.file.filename}`;
      console.log('Resim yüklendi:', imagePath);
    }
    
    const newCategory = new Category({
      name,
      description,
      icon,
      image: imagePath
    });
    
    await newCategory.save();
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('categoryUpdated', { 
        type: 'create', 
        category: newCategory,
        categoryId: newCategory._id,
        newImage: newCategory.image 
      });
    }
    
    res.status(201).json({ message: 'Kategori başarıyla oluşturuldu', category: newCategory });
  } catch (error) {
    console.error('createCategory hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Kategori güncelle
exports.updateCategory = async (req, res) => {
  try {
    console.log('updateCategory çağrıldı');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const { name, description, icon, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Aynı isimde başka bir kategori var mı kontrol et
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Bu isimde bir kategori zaten var' });
      }
    }

    // Eski resmi sil ve yeni resmi ekle
    if (req.file) {
      console.log('Yeni resim yüklendi:', req.file.filename);
      // Eski resmi sil
      if (category.image) {
        const oldImagePath = path.join(__dirname, '..', category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Eski resim silindi:', oldImagePath);
        }
      }
      // Yeni resim yolunu ayarla
      category.image = `/uploads/categories/${req.file.filename}`;
    }
    
    category.name = name || category.name;
    category.description = description || category.description;
    category.icon = icon || category.icon;
    
    if (isActive !== undefined) {
      category.isActive = isActive === 'true' || isActive === true;
    }
    
    await category.save();
    
    // Socket.io ile bildirim gönder - kategori resmi değiştiğinde tüm ilanlar da güncellenmeli
    if (global.io) {
      global.io.emit('categoryUpdated', { 
        type: 'update', 
        category,
        categoryId: category._id,
        newImage: category.image 
      });
    }
    
    res.json({ message: 'Kategori başarıyla güncellendi', category });
  } catch (error) {
    console.error('updateCategory hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Kategori sil
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Tamamen silmek yerine aktif durumunu kapatıyoruz
    category.isActive = false;
    await category.save();
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('categoryChanged', { 
        type: 'delete', 
        categoryId: category._id 
      });
    }
    
    res.json({ message: 'Kategori başarıyla devre dışı bırakıldı' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}; 