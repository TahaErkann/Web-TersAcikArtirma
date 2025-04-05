const Category = require('../models/Category');

// Tüm kategorileri getir
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
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
    const { name, description, icon } = req.body;
    
    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten var' });
    }
    
    const newCategory = new Category({
      name,
      description,
      icon
    });
    
    await newCategory.save();
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('categoryChanged', { type: 'create', category: newCategory });
    }
    
    res.status(201).json({ message: 'Kategori başarıyla oluşturuldu', category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Kategori güncelle
exports.updateCategory = async (req, res) => {
  try {
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
    
    category.name = name || category.name;
    category.description = description || category.description;
    category.icon = icon || category.icon;
    
    if (isActive !== undefined) {
      category.isActive = isActive;
    }
    
    await category.save();
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('categoryChanged', { type: 'update', category });
    }
    
    res.json({ message: 'Kategori başarıyla güncellendi', category });
  } catch (error) {
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