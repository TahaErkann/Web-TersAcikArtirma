import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getAllListings, getActiveListings } from '../services/listingService';
import { Listing } from '../types';
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
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// URL'den query parametrelerini almak için kullanılan yardımcı fonksiyon
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const { on, off } = useSocket();
  const query = useQuery();
  const categoryId = query.get('category');

  // Veri yükleme fonksiyonu
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tab değerine göre ilgili ilanları getir
      let data: Listing[];
      if (tabValue === 0) {
        data = await getActiveListings();
      } else {
        data = await getAllListings(categoryId || undefined);
      }
      
      // Boş veya hatalı alan kontrolü
      data = data.map(listing => ({
        ...listing,
        title: listing.title || 'İsimsiz İlan',
        currentPrice: listing.currentPrice || 0,
        startingPrice: listing.startingPrice || 0
      }));
      
      setListings(data);
      setLoading(false);
    } catch (err) {
      console.error('İlan yükleme hatası:', err);
      setError('İlanlar yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, categoryId]);

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

    // Socket dinleyicileri
    on('listingCreated', handleNewListing);
    on('listingUpdated', handleUpdateListing);
    on('listingDeleted', handleDeleteListing);

    // Temizleme
    return () => {
      off('listingCreated', handleNewListing);
      off('listingUpdated', handleUpdateListing);
      off('listingDeleted', handleDeleteListing);
    };
  }, [on, off]);

  // Tab değiştirme
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // Fiyat formatı
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

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
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Aktif İlanlar" />
        <Tab label="Tüm İlanlar" />
      </Tabs>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : listings.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {categoryId 
            ? 'Bu kategoride ilan bulunamadı.' 
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
          {listings.map((listing, index) => (
            <Box key={listing._id || index}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
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
                      image={listing.images?.[0] || 'https://via.placeholder.com/300x160?text=Resim+Yok'}
                      alt={listing.title}
                    />
                    <Chip
                      label={listing.status === 'active' ? 'Aktif' : listing.status === 'ended' ? 'Tamamlandı' : 'İptal Edildi'}
                      color={listing.status === 'active' ? 'success' : listing.status === 'ended' ? 'primary' : 'error'}
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
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {typeof listing.category === 'object' && listing.category ? listing.category.name : 'Genel'}
                    </Typography>
                    
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
          ))}
        </Box>
      )}
    </Container>
  );
};

export default ListingsPage; 