const User = require('../models/User');

// Kullanıcı profilini getir
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Kullanıcı profil bilgilerini güncelle
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, address, companyInfo } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Temel bilgileri güncelle
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    // Firma bilgilerini güncelle
    if (companyInfo) {
      user.companyInfo = {
        ...user.companyInfo,
        ...companyInfo
      };
    }
    
    await user.save();
    
    // Güncellenmiş kullanıcı bilgisini gönder
    res.json({
      message: 'Profil başarıyla güncellendi',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        companyInfo: user.companyInfo,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin: Tüm kullanıcıları listele
exports.getAllUsers = async (req, res) => {
  try {
    // Admin dışındaki kullanıcıları getir
    const users = await User.find({ isAdmin: false }).select('-password -__v');
    res.json(users);
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin: Kullanıcı durumunu (onay) güncelle
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApproved, isRejected, rejectionReason } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Onay durumunu güncelle
    if (isApproved !== undefined) user.isApproved = isApproved;
    if (isRejected !== undefined) user.isRejected = isRejected;
    
    // Ret sebebi ekle (eğer ret ediliyorsa)
    if (isRejected && rejectionReason) {
      user.rejectionReason = rejectionReason;
    } else if (!isRejected) {
      user.rejectionReason = '';
    }
    
    await user.save();
    
    res.json({
      message: 'Kullanıcı durumu güncellendi',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved,
        isRejected: user.isRejected,
        rejectionReason: user.rejectionReason
      }
    });
  } catch (error) {
    console.error('Kullanıcı durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}; 