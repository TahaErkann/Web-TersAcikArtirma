import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Request türünü genişlet
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Token'ı header'dan al
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız. Token bulunamadı.' });
  }
  
  // "Bearer " önekini kontrol et ve kaldır
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Geçersiz token formatı' });
  }
  
  const token = parts[1];
  
  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli-anahtar') as { userId: string };
    
    // req.user nesnesine kullanıcı kimliğini ekle
    req.user = { userId: decoded.userId };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token. Yetkilendirme başarısız.' });
  }
}; 