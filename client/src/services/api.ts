import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../types';

// API url'sini ayarla - Mock API ile çalışmak için
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Kısa gecikmeli mock veri fonksiyonu 
const mockData = {
  categories: [
    { _id: '1', name: 'Elektrik', description: 'Elektrik malzemeleri ve ekipmanları' },
    { _id: '2', name: 'Hırdavat', description: 'Hırdavat ve el aletleri' },
    { _id: '3', name: 'Nalburiye', description: 'Nalburiye malzemeleri' },
    { _id: '4', name: 'Yedek Parça', description: 'Araç ve makine yedek parçaları' },
    { _id: '5', name: 'İnşaat', description: 'İnşaat malzemeleri ve ekipmanları' },
    { _id: '6', name: 'Temizlik', description: 'Temizlik malzemeleri ve ekipmanları' }
  ],
  listings: [
    { 
      _id: '101', 
      title: 'Elektrik Kabloları', 
      description: 'Çeşitli ölçülerde elektrik kabloları', 
      currentPrice: 1500, 
      startingPrice: 2000, 
      status: 'active',
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      category: { _id: '1', name: 'Elektrik' },
      location: 'İstanbul',
      bids: [
        { _id: 'b1', amount: 1750, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: { _id: 'u1', username: 'teklif_veren1' } },
        { _id: 'b2', amount: 1650, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), user: { _id: 'u2', username: 'teklif_veren2' } },
        { _id: 'b3', amount: 1500, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), user: { _id: 'u3', username: 'teklif_veren3' } }
      ]
    },
    { 
      _id: '102', 
      title: 'İnşaat Demiri', 
      description: '8mm, 10mm ve 12mm inşaat demirleri', 
      currentPrice: 5800, 
      startingPrice: 6500, 
      status: 'active',
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      category: { _id: '5', name: 'İnşaat' },
      location: 'Ankara',
      bids: [
        { _id: 'b4', amount: 6200, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), user: { _id: 'u4', username: 'ankara_insaat' } },
        { _id: 'b5', amount: 5800, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), user: { _id: 'u5', username: 'demir_toptanci' } }
      ]
    },
    { 
      _id: '103', 
      title: 'Endüstriyel Temizlik Malzemeleri', 
      description: 'Fabrika ve büyük işletmeler için temizlik malzemeleri', 
      currentPrice: 3200, 
      startingPrice: 4000, 
      status: 'active',
      endDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      category: { _id: '6', name: 'Temizlik' },
      location: 'İzmir',
      bids: [
        { _id: 'b6', amount: 3500, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), user: { _id: 'u6', username: 'temiz_is_ltd' } },
        { _id: 'b7', amount: 3200, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), user: { _id: 'u7', username: 'ege_temizlik' } }
      ]
    }
  ]
};

const getMockData = (path: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path.includes('/categories')) {
        resolve({ data: mockData.categories });
      } else if (path.includes('/listings/active')) {
        resolve({ data: mockData.listings.filter(l => l.status === 'active') });
      } else if (path.includes('/listings')) {
        if (path.includes('?category=')) {
          const categoryId = path.split('?category=')[1];
          resolve({ data: mockData.listings.filter(l => l.category._id === categoryId) });
        } else if (path.match(/\/listings\/\w+/)) {
          const listingId = path.split('/listings/')[1];
          resolve({ data: mockData.listings.find(l => l._id === listingId) || null });
        } else {
          resolve({ data: mockData.listings });
        }
      } else {
        resolve({ data: [] });
      }
    }, 300);
  });
};

// API client oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor - server hatalarını yakala ve mock verileri kullan
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API İsteği Hatası:', error);
    
    // Eğer ağ hatası veya sunucu hatası varsa mock veri kullan
    if ((error.message === 'Network Error' || (error.response && error.response.status >= 500)) && error.config) {
      console.log('Sunucu hatası nedeniyle mock veriler kullanılıyor:', error.config.url);
      try {
        // Mock veri olarak kullanılacak veriyi belirle
        return getMockData(error.config.url);
      } catch (mockError) {
        console.error('Mock veri hatası:', mockError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 