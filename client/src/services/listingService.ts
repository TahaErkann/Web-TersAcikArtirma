import api from './api';
import { Listing } from '../types';

// Tüm ilanları getir
export const getAllListings = async (category?: string, status?: string): Promise<Listing[]> => {
  const params = new URLSearchParams();
  
  if (category) {
    params.append('category', category);
  }
  
  if (status) {
    params.append('status', status);
  }
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/listings${query}`);
  return response.data;
};

// İlan detayı getir
export const getListingById = async (id: string): Promise<Listing> => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

// Kullanıcının kendi ilanlarını getir
export const getMyListings = async (): Promise<Listing[]> => {
  const response = await api.get('/listings/user/mylistings');
  return response.data;
};

// Kullanıcının teklif verdiği ilanları getir
export const getMyBids = async (): Promise<Listing[]> => {
  const response = await api.get('/listings/user/mybids');
  return response.data;
};

// Yeni ilan oluştur
export const createListing = async (listingData: Partial<Listing>): Promise<Listing> => {
  const response = await api.post('/listings', listingData);
  return response.data.listing;
};

// İlan güncelle
export const updateListing = async (id: string, listingData: Partial<Listing>): Promise<Listing> => {
  const response = await api.put(`/listings/${id}`, listingData);
  return response.data.listing;
};

// İlan sil
export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/listings/${id}`);
};

// İlanı iptal et
export const cancelListing = async (id: string): Promise<Listing> => {
  const response = await api.put(`/listings/${id}/cancel`);
  return response.data.listing;
};

// İlana teklif ver
export const placeBid = async (id: string, price: number): Promise<Listing> => {
  const response = await api.post(`/listings/${id}/bid`, { price });
  return response.data.listing;
};

// İlanı tamamla/reddet
export const completeListing = async (id: string, accept: boolean): Promise<Listing> => {
  const response = await api.put(`/listings/${id}/complete`, { accept });
  return response.data.listing;
}; 