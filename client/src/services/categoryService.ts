import api from './api';
import { Category } from '../types';

// Tüm aktif kategorileri getir
export const getAllCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

// Admin: Tüm kategorileri getir (aktif/pasif tümü)
export const getAllCategoriesForAdmin = async (): Promise<Category[]> => {
  const response = await api.get('/categories/admin');
  return response.data;
};

// Kategori detayını getir
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Yeni kategori oluştur (admin)
export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

// Kategori güncelle (admin)
export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

// Kategori sil (admin)
export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
}; 