import api from './api';
import { User } from '../types';
import { jwtDecode } from "jwt-decode";

// Kullanıcı kaydı
export const register = async (userData: { name: string, email: string, password: string }): Promise<{ token: string, user: User }> => {
  try {
    console.log('Kayıt isteği gönderiliyor:', userData.email);
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    console.error('Kayıt hatası:', error);
    
    // Axios hata yanıtını kontrol et
    if (error.response) {
      // Sunucu tarafından dönen hata
      console.error('Sunucu hatası:', error.response.status, error.response.data);
      
      // 400 hatası - Email zaten kullanımda
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || 'Bu email adresi zaten kullanımda');
      }
      
      // 500 hatası - Sunucu hatası
      if (error.response.status === 500) {
        throw new Error(error.response.data.message || 'Sunucu hatası oluştu');
      }
    }
    
    // Genel hata
    throw new Error('Kayıt işlemi sırasında bir hata oluştu');
  }
};

// Kullanıcı girişi
export const login = async (credentials: { email: string, password: string }): Promise<{ token: string, user: User }> => {
  try {
    console.log('Giriş isteği gönderiliyor:', credentials.email);
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    console.error('Giriş hatası:', error);
    
    // Axios hata yanıtını kontrol et
    if (error.response) {
      // Sunucu tarafından dönen hata
      console.error('Sunucu hatası:', error.response.status, error.response.data);
      
      // 404 hatası - Kullanıcı bulunamadı
      if (error.response.status === 404) {
        throw new Error(error.response.data.message || 'Kullanıcı bulunamadı');
      }
      
      // 401 hatası - Geçersiz şifre
      if (error.response.status === 401) {
        throw new Error(error.response.data.message || 'Şifre hatalı');
      }
      
      // 500 hatası - Sunucu hatası
      if (error.response.status === 500) {
        throw new Error(error.response.data.message || 'Sunucu hatası oluştu');
      }
    }
    
    // Genel hata
    throw new Error('Giriş işlemi sırasında bir hata oluştu');
  }
};

// Token'dan kullanıcı bilgilerini çöz
export const decodeToken = (token: string): { userId: string, exp: number } => {
  return jwtDecode<{ userId: string, exp: number }>(token);
};

// Token'in geçerliliğini kontrol et
export const isTokenValid = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Mevcut kullanıcı bilgilerini getir
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Profil bilgilerini güncelle
export const updateProfile = async (profileData: Partial<User['companyInfo']>): Promise<User> => {
  const response = await api.put('/auth/profile', profileData);
  return response.data.user;
};

// Admin: Tüm kullanıcıları listele
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/auth/users');
  return response.data;
};

// Admin: Kullanıcıyı onayla
export const approveUser = async (userId: string): Promise<User> => {
  const response = await api.put(`/auth/users/${userId}/approve`);
  return response.data.user;
};

// Admin: Kullanıcıyı reddet
export const rejectUser = async (userId: string, reason: string): Promise<User> => {
  const response = await api.put(`/auth/users/${userId}/reject`, { reason });
  return response.data.user;
}; 