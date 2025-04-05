const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Token oluşturma
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Kullanıcı kaydı
exports.register = async (req, res) => {
  try {
    console.log('Register fonksiyonu çağrıldı');
    console.log('Request body:', req.body);
    
    const { name, email, password } = req.body;

    // Email kullanımda mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanımda' });
    }

    // Yeni kullanıcı oluştur
    console.log('Yeni kullanıcı oluşturuluyor:', { name, email });
    const newUser = new User({
      name,
      email,
      password,
      // Benzersiz bir googleId değeri ekliyoruz (Sorunun önerilen çözümü)
      googleId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    });

    console.log('Oluşturulan kullanıcı modeli:', newUser);
    await newUser.save();
    console.log('Kullanıcı kaydedildi');
    
    // Token oluştur
    const token = generateToken(newUser._id);

    res.status(201).json({ 
      message: 'Kullanıcı başarıyla kaydedildi', 
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isApproved: newUser.isApproved
      }
    });
  } catch (error) {
    console.error('Kayıt hatası detayları:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Kullanıcıyı email ile bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz şifre' });
    }
    
    // Token oluştur
    const token = generateToken(user._id);
    
    res.json({ 
      message: 'Giriş başarılı', 
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Mevcut kullanıcı bilgisini getir
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Profil bilgilerini güncelle
exports.updateProfile = async (req, res) => {
  try {
    const { companyName, address, city, phone, taxNumber, description } = req.body;
    
    // Kullanıcıyı bul ve güncelle
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Firma bilgilerini güncelle
    user.companyInfo = {
      companyName: companyName || user.companyInfo?.companyName,
      address: address || user.companyInfo?.address,
      city: city || user.companyInfo?.city,
      phone: phone || user.companyInfo?.phone,
      taxNumber: taxNumber || user.companyInfo?.taxNumber,
      description: description || user.companyInfo?.description
    };
    
    // Profil bilgisi eklendiğinde inceleme için gönder
    if (!user.isApproved && !user.isRejected) {
      user.isApproved = false; // İnceleme için bekliyor durumunda
    }
    
    await user.save();
    
    res.json({ message: 'Profil başarıyla güncellendi', user });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Firmaları Listele
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).select('-password -__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin: Firma Onaylama
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    user.isApproved = true;
    user.isRejected = false;
    user.rejectionReason = '';
    
    await user.save();
    
    res.json({ message: 'Firma başarıyla onaylandı', user });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Firma Reddetme
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    user.isApproved = false;
    user.isRejected = true;
    user.rejectionReason = reason || 'Onaylanmadı';
    
    await user.save();
    
    res.json({ message: 'Firma reddedildi', user });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}; 