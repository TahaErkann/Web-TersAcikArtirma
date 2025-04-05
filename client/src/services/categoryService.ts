import api from './api';
import { Category } from '../types';

// Tüm kategorileri getir
export const getAllCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

// Kategori detayı getir
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Admin: Yeni kategori oluştur
export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.post('/categories', categoryData);
  return response.data.category;
};

// Admin: Kategori güncelle
export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data.category;
};

// Admin: Kategori sil
export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
}; 