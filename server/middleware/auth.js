const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası: Token bulunamadı' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş token' });
  }
};

// Admin kontrolü
exports.isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekiyor' });
  }
  next();
};

// Onaylı firma kontrolü
exports.isApprovedCompany = (req, res, next) => {
  if (!req.user.isApproved) {
    return res.status(403).json({ message: 'Firma henüz onaylanmamış' });
  }
  next();
}; 