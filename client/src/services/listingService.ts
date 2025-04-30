import api from './api';
import { Listing, Bid } from '../types';

// Tüm ilanları getir
export const getAllListings = async (category?: string): Promise<Listing[]> => {
  const params = new URLSearchParams();
  
  if (category) {
    params.append('category', category);
  }
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/listings${query}`);
  return response.data;
};

// Aktif ilanları getir
export const getActiveListings = async (): Promise<Listing[]> => {
  const response = await api.get('/listings/active');
  return response.data;
};

// İlan detayı getir
export const getListingById = async (id: string): Promise<Listing> => {
  try {
    if (!id) {
      throw new Error('Geçersiz ilan ID');
    }
    
    console.log(`İlan detayı getiriliyor, ID: ${id}`);
    const response = await api.get(`/listings/${id}`);
    
    // Yanıtı kontrol et
    if (!response || !response.data) {
      console.error('Geçersiz API yanıtı:', response);
      throw new Error('İlan bilgileri alınamadı');
    }
    
    // Yanıtı döndürmeden önce gerekli alanlar varsa kontrol et
    const listing = response.data;
    
    console.log('Sunucudan gelen ham ilan verisi:', listing);
    
    // Temel değerleri varsayılan değerlerle doldur
    if (listing.startingPrice === undefined || listing.startingPrice === null) {
      console.warn('İlan başlangıç fiyatı eksik, varsayılan değer atanıyor');
      listing.startingPrice = 0;
    }
    
    if (listing.currentPrice === undefined || listing.currentPrice === null) {
      console.warn('İlan güncel fiyatı eksik, başlangıç fiyatı atanıyor');
      listing.currentPrice = listing.startingPrice;
    }
    
    // Bid dizisini kontrol et ve düzenle
    if (!Array.isArray(listing.bids)) {
      console.warn('İlan teklifleri dizi değil, boş dizi atanıyor');
      listing.bids = [];
    } else {
      // Teklifleri işle ve veri yapısını düzelt
      listing.bids = listing.bids.map(bid => {
        // Teklif yapısı sunucudan farklı gelebilir, düzenleme yapalım
        const processedBid: any = { ...bid };
        
        // Null veya eksik alanları düzelt
        if (!processedBid.amount && processedBid.amount !== 0) {
          processedBid.amount = 0;
        }
        
        // Kullanıcı bilgisini normalize et
        if (!processedBid.user) {
          processedBid.user = "Bilinmeyen Kullanıcı";
        } else if (typeof processedBid.user === 'object') {
          // Kullanıcı nesnesi ama username yok
          if (!processedBid.user.username) {
            processedBid.user.username = "İsimsiz Kullanıcı";
          }
        } else if (typeof processedBid.user === 'string' && processedBid.user.length < 3) {
          // Çok kısa kullanıcı ID'si
          processedBid.user = "Kullanıcı-" + processedBid.user;
        }
        
        // Timestamp kontrolü
        if (!processedBid.timestamp) {
          processedBid.timestamp = new Date().toISOString();
        }
        
        return processedBid;
      });
      
      // Teklifleri tarihe göre sırala
      listing.bids.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA; // En yeni en üstte
      });
    }
    
    // Tarih bilgisi kontrolü
    if (!listing.endDate) {
      console.warn('İlan bitiş tarihi eksik, varsayılan tarih atanıyor');
      // Varsayılan olarak bugünden 1 gün sonra
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      listing.endDate = tomorrow.toISOString();
    }
    
    // Diğer zorunlu alanları kontrol et
    if (!listing.title) listing.title = "İsimsiz İlan";
    if (!listing.description) listing.description = "Açıklama bulunmuyor";
    if (!listing.location) listing.location = "Belirtilmemiş";
    if (!listing.status) listing.status = "active";
    
    // İşlenmiş veriyi döndür
    console.log('İşlenmiş ilan verisi:', listing);
    return listing;
  } catch (error: any) {
    console.error('İlan detayı getirme hatası:', error);
    
    // Daha açıklayıcı hata mesajı
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('İlan bulunamadı');
      } else if (error.response.status === 500) {
        throw new Error('Sunucu hatası: İlan bilgileri alınamadı');
      } else if (error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
    }
    
    throw error;
  }
};

// Kullanıcının kendi ilanlarını getir
export const getMyListings = async (): Promise<Listing[]> => {
  const response = await api.get('/listings/my-listings');
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
  return response.data;
};

// İlan güncelle
export const updateListing = async (id: string, listingData: Partial<Listing>): Promise<Listing> => {
  const response = await api.put(`/listings/${id}`, listingData);
  return response.data;
};

// İlan sil
export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/listings/${id}`);
};

// İlanı iptal et (status'ü 'cancelled' yapar)
export const cancelListing = async (id: string): Promise<Listing> => {
  const response = await api.put(`/listings/${id}`, { status: 'cancelled' });
  return response.data;
};

// İlana teklif ver
export const placeBid = async (id: string, amount: number): Promise<Listing> => {
  const response = await api.post(`/listings/${id}/bid`, { amount });
  return response.data;
};

// İlanı tamamla/reddet
export const completeListing = async (id: string, accept: boolean): Promise<Listing> => {
  const response = await api.put(`/listings/${id}/complete`, { accept });
  return response.data.listing;
}; 