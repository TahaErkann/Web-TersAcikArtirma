import api from './api';
import { Listing, Bid } from '../types';

// Tüm ilanları getir
export const getAllListings = async (category?: string): Promise<Listing[]> => {
  const params = new URLSearchParams();
  
  if (category) {
    console.log(`getAllListings API çağrısı yapılıyor, kategori: ${category}`);
    params.append('category', category);
  } else {
    console.log('getAllListings API çağrısı yapılıyor, kategori filtresi olmadan');
  }
  
  const query = params.toString() ? `?${params.toString()}` : '';
  console.log(`API istek URL: /listings${query}`);
  
  try {
    const response = await api.get(`/listings${query}`);
    console.log(`API yanıtı: ${response.data.length} ilan`);
    
    // İlanların kategori bilgilerini kontrol et
    if (response.data.length > 0 && category) {
      const matchingCategoryItems = response.data.filter(item => {
        if (typeof item.category === 'object') {
          return item.category && item.category._id === category;
        } else {
          return item.category === category;
        }
      });
      
      console.log(`Kategori ${category} ile eşleşen ilan sayısı: ${matchingCategoryItems.length}`);
      if (matchingCategoryItems.length === 0) {
        console.warn('Hiçbir ilan seçilen kategori ile eşleşmiyor!');
        if (response.data.length > 0) {
          console.log('İlk ilan örneği:', response.data[0]);
        }
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('API isteği başarısız:', error);
    throw error;
  }
};

// Aktif ilanları getir
export const getActiveListings = async (): Promise<Listing[]> => {
  const response = await api.get('/listings/active');
  return response.data;
};

// İlan detayı getir
export const getListingById = async (id: string, includeFullDetails: boolean = false): Promise<Listing> => {
  try {
    if (!id) {
      throw new Error('Geçersiz ilan ID');
    }
    
    console.log(`İlan detayı getiriliyor, ID: ${id}, Tam detaylar: ${includeFullDetails}`);
    
    // Tam detaylar isteniyorsa URL'e parametre ekle
    const url = includeFullDetails 
      ? `/listings/${id}?fullDetails=true` 
      : `/listings/${id}`;
      
    const response = await api.get(url);
    
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
        
        // Kullanıcı bilgilerini normalize et
        if (!processedBid.user && !processedBid.bidder) {
          processedBid.user = "Bilinmeyen Kullanıcı";
        } else {
          // User ve bidder alanları arasında bilgileri senkronize edelim
          // Detaylı kullanıcı bilgilerini elde edelim
          if (typeof processedBid.user === 'object' && processedBid.user) {
            // Kullanıcı objesini daha ayrıntılı logla
            console.log(`Bid ID ${processedBid._id} için user bilgileri:`, processedBid.user);
            
            // Eğer bidder alanı yoksa ve user nesnesi varsa, user'ı bidder'a kopyala
            if (!processedBid.bidder) {
              processedBid.bidder = { ...processedBid.user };
            } 
            // Eğer her ikisi de varsa, eksik alanları birbirlerinden tamamla
            else if (typeof processedBid.bidder === 'object') {
              // bidder'da olmayan user bilgilerini ekle
              Object.keys(processedBid.user).forEach(key => {
                if (processedBid.bidder[key] === undefined || processedBid.bidder[key] === null) {
                  processedBid.bidder[key] = processedBid.user[key];
                }
              });
              
              // user'da olmayan bidder bilgilerini ekle
              Object.keys(processedBid.bidder).forEach(key => {
                if (processedBid.user[key] === undefined || processedBid.user[key] === null) {
                  processedBid.user[key] = processedBid.bidder[key];
                }
              });
              
              // companyInfo alanını özel olarak işle
              if (processedBid.user.companyInfo || processedBid.bidder.companyInfo) {
                processedBid.user.companyInfo = processedBid.user.companyInfo || {};
                processedBid.bidder.companyInfo = processedBid.bidder.companyInfo || {};
                
                // Her iki companyInfo'yu birleştir
                Object.keys({ ...processedBid.user.companyInfo, ...processedBid.bidder.companyInfo }).forEach(key => {
                  processedBid.user.companyInfo[key] = processedBid.user.companyInfo[key] || processedBid.bidder.companyInfo[key];
                  processedBid.bidder.companyInfo[key] = processedBid.bidder.companyInfo[key] || processedBid.user.companyInfo[key];
                });
              }
            }
            
            // Tüm kullanıcılar için isApproved alanı varsayılan true olsun (çünkü onaylanmamış kullanıcılar teklif veremez)
            processedBid.user.isApproved = true;
            if (typeof processedBid.bidder === 'object') {
              processedBid.bidder.isApproved = true;
            }
          }
          // Eğer bidder nesnesi var ama user yoksa veya string ise
          else if (typeof processedBid.bidder === 'object' && processedBid.bidder) {
            console.log(`Bid ID ${processedBid._id} için bidder bilgileri:`, processedBid.bidder);
            
            // Eğer user alanı string veya yoksa, bidder'ı user'a kopyala
            if (typeof processedBid.user !== 'object' || !processedBid.user) {
              processedBid.user = { ...processedBid.bidder };
            }
            
            // Tüm kullanıcılar için isApproved alanı varsayılan true olsun
            processedBid.bidder.isApproved = true;
            if (typeof processedBid.user === 'object') {
              processedBid.user.isApproved = true;
            }
          }
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
  console.log(`Teklif gönderiliyor: id=${id}, amount=${amount}`);
  
  try {
    // Değeri doğru formata çevirelim
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount)) {
      throw new Error('Geçersiz teklif miktarı');
    }
    
    // Hem price hem de amount parametrelerini gönderelim
    const response = await api.post(`/listings/${id}/bid`, { 
      price: numericAmount,
      amount: numericAmount
    });
    
    console.log(`Teklif yanıtı:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error('Teklif gönderme hatası:', error);
    
    // Sunucudan dönen hata mesajını doğru şekilde alıp gösterelim
    if (error.response && error.response.data) {
      if (error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    }
    throw error;
  }
};

// İlanı tamamla/reddet
export const completeListing = async (id: string, accept: boolean): Promise<Listing> => {
  const response = await api.put(`/listings/${id}/complete`, { accept });
  return response.data.listing;
};

// Teklifi kabul et
export const acceptBid = async (listingId: string, bidId: string): Promise<Listing> => {
  try {
    const response = await api.post(`/listings/${listingId}/bids/${bidId}/accept`);
    return response.data;
  } catch (error: any) {
    console.error('Teklif kabul hatası:', error);
    
    // Sunucudan dönen hata mesajını gösterelim
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.data.error) {
        throw new Error(error.response.data.error);
      }
    }
    throw new Error('Teklif kabul edilirken bir hata oluştu');
  }
}; 