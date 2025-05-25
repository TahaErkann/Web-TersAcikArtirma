import React, { useState, useEffect, useContext } from 'react';import { Link as RouterLink, useLocation } from 'react-router-dom';import { useSocket } from '../context/SocketContext';import { AuthContext } from '../context/AuthContext';
import { getAllListings, getActiveListings } from '../services/listingService';
import { getAllCategories } from '../services/categoryService';
import { Listing, Category } from '../types';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

// URL'den query parametrelerini almak için kullanılan yardımcı fonksiyon
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Kategori resimlerini döndüren yardımcı fonksiyon
const getCategoryImage = (category: any, categories: Category[]): string => {
  // Eğer kategori bir obje ise ve image alanı varsa, backend'den gelen resmi kullan
  if (typeof category === 'object' && category?.image) {
    return `http://localhost:5001${category.image}`;
  }
  
  // Kategori string ise, kategoriler listesinden resmi bul
  if (typeof category === 'string') {
    const foundCategory = categories.find(cat => cat._id === category);
    if (foundCategory && foundCategory.image) {
      return `http://localhost:5001${foundCategory.image}`;
    }
  }
  
  // Kategori adına göre resim bul (obje ise)
  if (typeof category === 'object' && category?.name) {
    const foundCategory = categories.find(cat => cat.name === category.name);
    if (foundCategory && foundCategory.image) {
      return `http://localhost:5001${foundCategory.image}`;
    }
  }
  
  // Varsayılan resmi döndür - manuel resimler kaldırıldı
  return "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=500";
};

export const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { on, off } = useSocket();
  const state = useContext(AuthContext);
  const query = useQuery();
  const categoryId = query.get('category');
  const [initialized, setInitialized] = useState<boolean>(false);
  
  // Filtreleme ve sıralama için state değişkenleri
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // İlanın süresi doldu mu kontrol et (ListingDetailPage'den alındı)
  const isExpired = (listing: Listing) => {
    // expiresAt alanı varsa onu kullan (tekliflerden sonra güncellenen son geçerlilik süresi)
    if (listing.expiresAt) {
      return new Date(listing.expiresAt) < new Date();
    }
    
    // Yoksa endDate'i kullan (ilk oluşturulduğundaki bitiş tarihi) 
    if (listing.endDate) {
      return new Date(listing.endDate) < new Date();
    }
    
    return false;
  };

  // İlanın aktif olup olmadığını kontrol etme
  const isListingActive = (listing: Listing): boolean => {
    // endDate yoksa varsayılan olarak aktif olarak kabul et
    if (!listing.endDate) return true;
    
    // Bitiş tarihi geçmiş mi kontrol et
    const now = new Date().getTime();
    const endTime = new Date(listing.endDate).getTime();
    
    return endTime > now;
  };

  // İlanların durumlarını manuel olarak kontrol eden fonksiyon ekliyorum
  const updateListingStatuses = (listings: Listing[]): Listing[] => {
    const currentTime = new Date().getTime();
    
    return listings.map(listing => {
      // Derin kopya oluştur
      const updatedListing = JSON.parse(JSON.stringify(listing));
      
      // Bitiş tarihi varsa ve geçmişse durumu güncelle
      if (updatedListing.endDate) {
        const endTime = new Date(updatedListing.endDate).getTime();
        if (endTime <= currentTime) {
          updatedListing.status = 'ended';
        }
      }
      
      return updatedListing;
    });
  };

  // Veri yükleme fonksiyonu
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // İlanları getir
      let data: Listing[];
      
      console.log(`Kategori filtreleme için API isteği: Kategori=${selectedCategory}`);
      
      // Kategori seçilmişse o kategoriye ait ilanları getir, değilse tüm ilanları getir
      data = await getAllListings(selectedCategory || undefined);
      console.log(`${selectedCategory || 'Tüm kategoriler'} için ${data.length} ilan getirildi`);
      
      // API'dan dönen kategori verilerinin yapısını kontrol edelim
      console.log("Kategori bilgisi örnekleri:");
      data.slice(0, 3).forEach(listing => {
        console.log("İlan:", listing.title);
        console.log("Kategori verisi:", listing.category);
        if (typeof listing.category === 'object') {
          console.log("Kategori _id:", listing.category._id);
          console.log("Kategori name:", listing.category.name);
        } else {
          console.log("Kategori (string olarak):", listing.category);
        }
      });
      
      // Şu anki zamanı bir kez hesapla
      const currentTime = new Date().getTime();
      
      // İlanların durumlarını güncelle (bitiş sürelerini kontrol ederek)
      data = data.map(listing => {
        // Derin kopya oluştur
        const updatedListing = JSON.parse(JSON.stringify(listing));
        
        // Bitiş tarihini kontrol et ve süresi dolmuşsa güncelle
        if (isExpired(updatedListing)) {
          console.log(`Süresi geçmiş ilan güncelleniyor: ${updatedListing.title} (ID: ${updatedListing._id})`);
          console.log(`Bitiş tarihi: ${updatedListing.endDate}, Şu anki zaman: ${new Date().toISOString()}`);
          updatedListing.status = 'ended'; // Durum güncelleniyor
        }
        
        return updatedListing;
      });
      
      console.log("İlanların durumları güncellendi:", data.map(l => ({ id: l._id, title: l.title, status: l.status })));
      
      setListings(data);
      applyFiltersAndSort(data);
      setLoading(false);
    } catch (err) {
      console.error('İlan yükleme hatası:', err);
      setError('İlanlar yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  // Yükleme ve state başlatma mantığı
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      
      try {
        // Kategorileri yükle
        await loadCategories();
        
        // Kategori varsa state'e ekle
        if (categoryId) {
          setSelectedCategory(categoryId);
        }
        
        // İlanları yükle
        fetchListings();
      } catch (err) {
        console.error('İlan yükleme hatası:', err);
        setError('İlanlar yüklenirken bir hata oluştu.');
        setLoading(false);
      }
      
      setInitialized(true);
    };
    
    initPage();
  }, [categoryId]);

  // Filtreleme ve sıralama değiştiğinde yeniden uygula
  useEffect(() => {
    if (listings.length > 0) {
      // Durumları güncellenmiş ilanları alıyoruz
      const updatedListings = updateListingStatuses(listings);
      applyFiltersAndSort(updatedListings);
    }
  }, [sortBy, statusFilter, listings]);

  // İlanları filtreleme ve sıralama fonksiyonu
  const applyFiltersAndSort = (data: Listing[]) => {
    let result = [...data];
    
    // Eğer veri yoksa boş liste döndür
    if (result.length === 0) {
      setFilteredListings([]);
      return;
    }
    
    console.log(`applyFiltersAndSort başlıyor. Toplam ${result.length} ilan var.`);
    console.log(`Kategori filtresi: ${selectedCategory || 'Yok'}`);
    
    // Kategori filtresi (selectedCategory state'inde saklanan kategori ID'sine göre)
    if (selectedCategory) {
      // API'den dönen kategori verisinin yapısını kontrol edelim ve her türlü format için filtreleyelim
      console.log("Kategori filtresi uygulanıyor:", selectedCategory);
      
      const beforeFilter = result.length;
      
      // Filtreleme işlemini yapmadan önce ilanların kategori yapısını inceleyelim
      result.forEach((listing, idx) => {
        if (listing.category) {
          console.log(`İlan #${idx} kategorisi:`, listing.category, typeof listing.category);
        }
      });
      
      result = result.filter(listing => {
        // Kategorisi olmayan ilanları filtrele
        if (!listing.category) {
          console.log(`Kategorisi olmayan ilan filtrelendi:`, listing.title);
          return false;
        }
        
        // 1. Kategori bir obje ise (category: { _id: '...', name: '...' })
        if (typeof listing.category === 'object' && listing.category !== null) {
          const match = listing.category._id === selectedCategory;
          if (match) {
            console.log(`Kategori eşleşmesi (obje): ${listing.title} - ${listing.category._id}`);
          }
          return match;
        }
        // 2. Kategori bir string ise doğrudan ID değerini içerir
        else if (typeof listing.category === 'string') {
          const match = listing.category === selectedCategory;
          if (match) {
            console.log(`Kategori eşleşmesi (string): ${listing.title} - ${listing.category}`);
          }
          return match;
        }
        
        return false;
      });
      
      console.log(`Filtreleme sonrası ilan sayısı: ${result.length} (önceki: ${beforeFilter})`);
      
      // Eğer seçilen kategoride hiç ilan yoksa, boş liste göstermeliyiz
      if (result.length === 0) {
        console.warn(`${selectedCategory} kategorisinde hiç ilan bulunamadı!`);
        setFilteredListings([]);
        return;
      }
    }
    
    // Durum filtresini uygula
    if (statusFilter === 'active') {
      result = result.filter(listing => listing.status === 'active');
    } else if (statusFilter === 'ended') {
      result = result.filter(listing => listing.status === 'ended');
    }
    
    // Sıralama uygula
    switch (sortBy) {
      case 'priceAsc':
        result.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'endDateAsc':
        result.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
        break;
      case 'endDateDesc':
        result.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });
        break;
      case 'newest':
        result.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        break;
      default:
        // Varsayılan olarak en yeni ilanları göster
        result.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    
    setFilteredListings(result);
  };

  // Kategori bilgilerini yükleyen yardımcı fonksiyon
  const loadCategories = async () => {
    try {
      console.log('Kategoriler yükleniyor...');
      const categoriesData = await getAllCategories();
      console.log(`${categoriesData.length} kategori yüklendi.`);
      categoriesData.forEach(cat => {
        console.log(`Kategori: ${cat.name} (${cat._id})`);
      });
      setCategories(categoriesData);
      return categoriesData;
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
      return [];
    }
  };

  // Kategori değiştiğinde
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const newCategoryId = event.target.value;
    console.log(`==========================================`);
    console.log(`KATEGORİ DEĞİŞTİ: ${newCategoryId ? newCategoryId : 'Tüm Kategoriler'}`);
    console.log(`==========================================`);
    
    // Kategori değiştiğinde önce tüm state'leri sıfırlayalım
    setLoading(true);
    setFilteredListings([]);
    setListings([]);
    
    if (newCategoryId) {
      // Seçilen kategori gerçekten mevcut mu kontrol edelim
      const selectedCategoryObj = categories.find(cat => cat._id === newCategoryId);
      if (selectedCategoryObj) {
        console.log(`Seçilen kategori: ${selectedCategoryObj.name} (${selectedCategoryObj._id})`);
      } else {
        console.warn(`DİKKAT: ${newCategoryId} ID'li kategori bulunamadı!`);
        
        // Kategoriler yeniden yüklensin
        loadCategories().then(() => {
          console.log('Kategoriler yenilendi. Tekrar kontrol ediliyor...');
          const refreshedCategory = categories.find(cat => cat._id === newCategoryId);
          if (refreshedCategory) {
            console.log(`Kategori bulundu: ${refreshedCategory.name}`);
          } else {
            console.warn(`Kategori hala bulunamadı: ${newCategoryId}`);
          }
        });
      }
    } else {
      console.log("Tüm kategoriler seçildi");
    }
    
    // Kategori ID'sini güncelle
    setSelectedCategory(newCategoryId);
    
    // Kategori değiştiğinde verileri doğrudan yükle
    const loadData = async () => {
      try {
        let data: Listing[];
        
        // Yeni kategori ID'si ile ilanları getir
        data = await getAllListings(newCategoryId || undefined);
        
        console.log(`Kategori filtreleme sonrası veri: ${data.length} ilan`);
        
        // Hiç ilan yoksa boş liste göster
        if (data.length === 0) {
          console.warn('API\'den hiç ilan dönmedi. Filtrelenmiş liste boş.');
          setListings([]);
          setFilteredListings([]);
          setLoading(false);
          return;
        }
        
        // Durumları güncelle
        data = data.map(listing => {
          const updatedListing = JSON.parse(JSON.stringify(listing));
          if (isExpired(updatedListing)) {
            updatedListing.status = 'ended';
          }
          return updatedListing;
        });
        
        setListings(data);
        applyFiltersAndSort(data);
        setLoading(false);
      } catch (error) {
        console.error('Kategori değişimi sırasında veri yükleme hatası:', error);
        setError('İlanlar yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    loadData();
  };

  // Sıralama değiştiğinde
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  // Durum filtresi değiştiğinde
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  // Socket.io bağlantısı
  useEffect(() => {
    // Yeni ilan eklendiğinde
    const handleNewListing = (data: any) => {
      setListings(prev => [data, ...prev]);
    };

    // İlan güncellendiğinde
    const handleUpdateListing = (data: any) => {
      setListings(prev => 
        prev.map(listing => listing._id === data._id ? data : listing)
      );
    };

    // İlan silindiğinde
    const handleDeleteListing = (id: string) => {
      setListings(prev => prev.filter(listing => listing._id !== id));
    };

    // Kategori güncellendiğinde - ilanların resimlerini güncelle
    const handleCategoryUpdated = (data: any) => {
      console.log('Kategori güncellendi:', data);
      // İlanları yeniden yükle ki kategori resimleri güncellensin
      fetchListings();
    };

    // Socket dinleyicileri
    on('listingCreated', handleNewListing);
    on('listingUpdated', handleUpdateListing);
    on('listingDeleted', handleDeleteListing);
    on('categoryUpdated', handleCategoryUpdated);

    // Temizleme
    return () => {
      off('listingCreated', handleNewListing);
      off('listingUpdated', handleUpdateListing);
      off('listingDeleted', handleDeleteListing);
      off('categoryUpdated', handleCategoryUpdated);
    };
  }, [on, off, fetchListings]);

  // Fiyat formatı
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Sayfa yüklendiğinde debug yapalım
  useEffect(() => {
    const checkExpiryDates = () => {
      console.log("Sayfa yüklendi - İlanların durumlarını kontrol ediyorum");
      // Tüm ilanların durumları güncelleniyor
      if (listings.length > 0) {
        const currentTime = Date.now();
        listings.forEach(listing => {
          if (listing.endDate) {
            const endTime = new Date(listing.endDate).getTime();
            const isExpired = endTime <= currentTime;
            console.log(`İlan: ${listing.title}, ID: ${listing._id}, Status: ${listing.status}, EndDate: ${listing.endDate}, IsExpired: ${isExpired}`);
          } else {
            console.log(`İlan: ${listing.title}, ID: ${listing._id}, Status: ${listing.status}, EndDate: YOK`);
          }
        });
      }
    };
    
    checkExpiryDates();
  }, [listings]);
  
  // İlanların durum etiketini direkt olarak hesaplayan yardımcı fonksiyon
  const getCardStatusInfo = (listing: Listing): { label: string; color: "success" | "primary" | "error" } => {
    // Önce süresi dolmuş mu kontrol et (DetailPage ile aynı mantık)
    if (isExpired(listing)) {
      return { 
        label: 'Süresi Dolmuş', 
        color: 'primary' 
      };
    }
    
    // Süresi dolmadıysa, durum alanına göre göster
    if (listing.status === 'active') {
      return { 
        label: 'Aktif', 
        color: 'success' 
      };
    } else if (listing.status === 'ended') {
      return { 
        label: 'Süresi Dolmuş', 
        color: 'primary' 
      };
    } else {
      return { 
        label: 'İptal Edildi', 
        color: 'error' 
      };
    }
  };

  // Bitiş tarihine göre kalan süreyi hesaplama
  const calculateTimeLeft = (endDate: string) => {
    const difference = new Date(endDate).getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return 'Süre doldu';
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} gün ${hours} saat`;
    }
    return `${hours} saat`;
  };

  // DOM yüklendikten sonra ilan kartlarını manuel olarak düzelteceğiz
  useEffect(() => {
    console.log("DOM düzeltme fonksiyonu çalıştı");
    // İlan kartlarındaki durumları düzenleyen fonksiyon
    const fixListingStatuses = () => {
      setTimeout(() => {
        try {
          // Tüm ilan kartlarında durum etiketlerini seç
          const statusChips = document.querySelectorAll('.MuiChip-root');
          console.log(`${statusChips.length} adet durum etiketi bulundu`);
          
          // Her bir etiketi kontrol et
          statusChips.forEach((chip: any) => {
            // Sadece ilan kartlarındaki durum etiketlerini hedefle
            if (chip.style.position === 'absolute' && chip.style.top === '10px' && chip.style.right === '10px') {
              // Kart üzerinde endDate ve status verilerini ara
              const cardElement = chip.closest('.MuiCard-root');
              if (cardElement) {
                // Karta en yakın link elemana bak ve ID'yi çıkar
                const linkElement = cardElement.querySelector('a');
                if (linkElement && linkElement.href) {
                  const hrefParts = linkElement.href.split('/');
                  const listingId = hrefParts[hrefParts.length - 1];
                  
                  // İlan ID'sini kullanarak durumu güncelle
                  const listing = listings.find(l => l._id === listingId);
                  if (listing) {
                    // Süresi dolmuş mu kontrol et
                    const expired = isExpired(listing);
                    
                    // Etiket içeriğini ve rengini güncelle
                    if (expired) {
                      // İçindeki span elementini bul (etiket metni)
                      const labelSpan = chip.querySelector('span.MuiChip-label');
                      if (labelSpan) {
                        labelSpan.textContent = 'Süresi Dolmuş';
                        console.log(`İlan #${listingId} etiketi düzeltildi: Süresi Dolmuş`);
                      }
                      
                      // Renk sınıflarını değiştir
                      chip.classList.remove('MuiChip-colorSuccess');
                      chip.classList.add('MuiChip-colorPrimary');
                    }
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error("DOM düzeltme hatası:", error);
        }
      }, 500); // Kartların render olması için bir süre bekle
    };
    
    // Sayfa yüklendiğinde ve filtreleme değiştiğinde çalıştır
    fixListingStatuses();
    
    return () => {
      // Temizleme işlemi gerekiyorsa
    };
  }, [filteredListings, listings]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          color="primary"
        >
          {categoryId ? 'Kategori İlanları' : 'Tüm İlanlar'}
        </Typography>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/create-listing"
        >
          Yeni İlan Oluştur
        </Button>
      </Box>
      
      {/* Filtreleme ve Sıralama Araçları */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="category-select-label">Kategori</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={selectedCategory}
            label="Kategori"
            onChange={handleCategoryChange}
            startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="">Tüm Kategoriler</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <InputLabel id="sort-select-label">Sıralama</InputLabel>
          <Select
            labelId="sort-select-label"
            id="sort-select"
            value={sortBy}
            label="Sıralama"
            onChange={handleSortChange}
            startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="newest">En Yeni</MenuItem>
            <MenuItem value="oldest">En Eski</MenuItem>
            <MenuItem value="priceAsc">Fiyat: Düşükten Yükseğe</MenuItem>
            <MenuItem value="priceDesc">Fiyat: Yüksekten Düşüğe</MenuItem>
            <MenuItem value="endDateAsc">Bitiş: Yakından Uzağa</MenuItem>
            <MenuItem value="endDateDesc">Bitiş: Uzaktan Yakına</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small">
          <InputLabel id="status-select-label">Durum</InputLabel>
          <Select
            labelId="status-select-label"
            id="status-select"
            value={statusFilter}
            label="Durum"
            onChange={handleStatusFilterChange}
            startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="all">Tüm İlanlar</MenuItem>
            <MenuItem value="active">Aktif İlanlar</MenuItem>
            <MenuItem value="ended">Süresi Dolmuş İlanlar</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : filteredListings.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {selectedCategory 
            ? `"${categories.find(c => c._id === selectedCategory)?.name || selectedCategory}" kategorisinde ilan bulunamadı.` 
            : 'Hiç ilan bulunamadı. İlk ilanı sen oluşturmak ister misin?'}
        </Alert>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {filteredListings.map((listing, index) => {
            // Her kart için durum bilgisi hesapla
            const statusInfo = getCardStatusInfo(listing);
            
            return (
              <Box key={`${listing._id || index}-${statusInfo.label}`}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    bgcolor: (() => {
                      // Kullanıcı giriş yapmamışsa beyaz göster
                      if (!state.user) return 'white';
                      
                      // Kullanıcı ID'sini alalım
                      const userId = state.user._id;
                      const HIGHLIGHT_COLOR = '#FFF9C4'; // Açık sarı ton
                      
                      // seller bir obje ise ve _id özelliği varsa
                      if (typeof listing.seller === 'object' && listing.seller && listing.seller._id) {
                        if (listing.seller._id === userId) return HIGHLIGHT_COLOR;
                      } 
                      // seller bir string ise
                      else if (typeof listing.seller === 'string') {
                        if (listing.seller === userId) return HIGHLIGHT_COLOR;
                      }
                      
                      // Ayrıca owner alanı da kontrol edilmeli
                      if (typeof listing.owner === 'object' && listing.owner && listing.owner._id) {
                        if (listing.owner._id === userId) return HIGHLIGHT_COLOR;
                      }
                      else if (typeof listing.owner === 'string') {
                        if (listing.owner === userId) return HIGHLIGHT_COLOR;
                      }
                      
                      return 'white';
                    })(),
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardActionArea 
                    component={RouterLink} 
                    to={`/listings/${listing._id}`}
                    sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={listing.images?.[0] || getCategoryImage(listing.category, categories)}
                        alt={listing.title}
                        sx={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      />
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Chip
                        label={typeof listing.category === 'object' && listing.category ? listing.category.name : 'Genel'}
                        size="small"
                        sx={{ 
                          alignSelf: 'flex-start',
                          mb: 2,
                          backgroundColor: '#e8f5fe',
                          color: '#0288d1',
                          fontWeight: 'medium',
                          '&:hover': { backgroundColor: '#d1e8fd' }
                        }}
                      />
                      
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 'bold',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 2
                        }}
                      >
                        {listing.title}
                      </Typography>

                      <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Başlangıç:
                          </Typography>
                          <Typography variant="body2" color="text.primary" fontWeight="bold">
                            {formatPrice(listing.startingPrice)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Güncel:
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            {formatPrice(listing.currentPrice)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Kalan Süre:
                          </Typography>
                          <Typography variant="body2" color="error" fontWeight="bold">
                            {listing.endDate ? calculateTimeLeft(listing.endDate) : 'Belirsiz'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default ListingsPage; 