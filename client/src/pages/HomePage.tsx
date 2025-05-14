//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  CardActions,
  Paper,
  Stack,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  CircularProgress,
  Link
} from '@mui/material';
import { 
  ShoppingCart, 
  GroupAdd, 
  MonetizationOn, 
  AccessTime, 
  ArrowForward, 
  Star,
  CheckCircle,
  Storefront,
  Category,
  Gavel,
  Business,
  LocalOffer as LocalOfferIcon,
  Timer as TimerIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import AnimatedComponents from '../components/AnimatedComponents';

const { 
  AnimatedHero, 
  AnimatedCard, 
  AnimatedButton, 
  StaggeredList, 
  AnimateOnScroll 
} = AnimatedComponents;

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { on, off } = useSocket();
  
  const [activeListings, setActiveListings] = useState<number>(0);
  const [lastBid, setLastBid] = useState<any>(null);
  const [categories, setCategories] = useState([
    { name: 'Elektrik', count: 0, icon: <MonetizationOn />, color: theme.palette.primary.main },
    { name: 'Hırdavat', count: 0, icon: <Business />, color: theme.palette.secondary.main },
    { name: 'Nalburiye', count: 0, icon: <Category />, color: theme.palette.info.main },
    { name: 'Yedek Parça', count: 0, icon: <Storefront />, color: theme.palette.success.main },
    { name: 'İnşaat', count: 0, icon: <Gavel />, color: theme.palette.warning.main },
    { name: 'Temizlik', count: 0, icon: <CheckCircle />, color: theme.palette.error.main }
  ]);
  
  // Verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Aktif ilanları getir
        const listingsResponse = await api.get('/listings/active');
        setActiveListings(listingsResponse.data.length);
        
        // Kategorileri getir
        const categoriesResponse = await api.get('/categories');
        const categoryData = categoriesResponse.data;
        
        if (categoryData && categoryData.length > 0) {
          // Veri tabanından gelen kategorilere göre state'i güncelle
          const updatedCategories = categoryData.map(dbCat => {
            // İkon ve renk eşleştirme
            let icon = <Category />;
            let color = theme.palette.primary.main;
            
            // İsme göre ikon ve renk ata
            switch(dbCat.name.toLowerCase()) {
              case 'elektrik':
                icon = <MonetizationOn />;
                color = theme.palette.primary.main;
                break;
              case 'hırdavat':
                icon = <Business />;
                color = theme.palette.secondary.main;
                break;
              case 'nalburiye':
                icon = <Category />;
                color = theme.palette.info.main;
                break;
              case 'yedek parça':
                icon = <Storefront />;
                color = theme.palette.success.main;
                break;
              case 'inşaat':
                icon = <Gavel />;
                color = theme.palette.warning.main;
                break;
              case 'temizlik':
                icon = <CheckCircle />;
                color = theme.palette.error.main;
                break;
              default:
                icon = <Category />;
                color = theme.palette.primary.main;
            }
            
            return {
              ...dbCat,
              icon,
              color,
              count: 0 // İlk başta 0 olarak ayarla, aşağıda güncelleyeceğiz
            };
          });
          
          // Her kategori için ilan sayısını getir
          for (let i = 0; i < updatedCategories.length; i++) {
            try {
              const catListings = await api.get(`/listings?category=${updatedCategories[i]._id}`);
              updatedCategories[i].count = catListings.data.length;
            } catch (err) {
              console.error(`${updatedCategories[i].name} kategorisi için ilan sayısı yüklenemedi:`, err);
            }
          }
          
          setCategories(updatedCategories);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Socket.io dinleyicileri
  useEffect(() => {
    // Yeni teklif geldiğinde
    const handleBidUpdate = (data) => {
      setLastBid(data);
      console.log('Yeni teklif:', data);
    };
    
    // Yeni ilan eklendiğinde
    const handleNewListing = (data) => {
      setActiveListings(prev => prev + 1);
      
      // Kategori sayısını güncelle
      if (data.category && data.category.name) {
        setCategories(prev => 
          prev.map(cat => 
            cat.name === data.category.name 
              ? { ...cat, count: cat.count + 1 } 
              : cat
          )
        );
      }
    };
    
    // İlan silindiğinde
    const handleListingDeleted = (data) => {
      setActiveListings(prev => Math.max(0, prev - 1));
    };
    
    // Kategori güncellendiğinde
    const handleCategoryChanged = (data) => {
      if (data.type === 'create') {
        setCategories(prev => [...prev, { name: data.category.name, count: 0 }]);
      } else if (data.type === 'update') {
        setCategories(prev => 
          prev.map(cat => 
            cat.name === data.category.name 
              ? { ...cat, name: data.category.name } 
              : cat
          )
        );
      } else if (data.type === 'delete') {
        setCategories(prev => prev.filter(cat => cat._id !== data.categoryId));
      }
    };
    
    // Socket dinleyicilerini ekle
    on('bidUpdate', handleBidUpdate);
    on('listingCreated', handleNewListing);
    on('listingDeleted', handleListingDeleted);
    on('categoryChanged', handleCategoryChanged);
    
    // Temizleme
    return () => {
      off('bidUpdate', handleBidUpdate);
      off('listingCreated', handleNewListing);
      off('listingDeleted', handleListingDeleted);
      off('categoryChanged', handleCategoryChanged);
    };
  }, [on, off]);
  
  const features = [
    {
      title: 'Ters Açık Artırma',
      description: 'Ters açık artırma sistemi ile en düşük teklifi veren kazanır.',
      icon: <MonetizationOn fontSize="large" sx={{ color: 'primary.main' }} />,
      color: alpha(theme.palette.primary.main, 0.08)
    },
    {
      title: 'Güvenli Alışveriş',
      description: 'Onaylı firmalar arasında güvenli ticaret yapın.',
      icon: <CheckCircle fontSize="large" sx={{ color: 'success.main' }} />,
      color: alpha(theme.palette.success.main, 0.08)
    },
    {
      title: 'Gerçek Zamanlı Takip',
      description: 'İlanlarınızı ve teklifleri gerçek zamanlı olarak takip edin.',
      icon: <AccessTime fontSize="large" sx={{ color: 'info.main' }} />,
      color: alpha(theme.palette.info.main, 0.08)
    }
  ];
  
  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      company: "ABC Elektrik",
      text: "Bu platform sayesinde firmamız için gereken malzemeleri çok daha uygun fiyatlara temin ettik.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      name: "Ayşe Demir",
      company: "Demir İnşaat",
      text: "İnşaat malzemeleri için ihtiyaçlarımızı buradan karşılıyoruz. Tedarikçilerle doğrudan iletişim kurmak büyük avantaj.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      name: "Mehmet Kaya",
      company: "Kaya Market",
      text: "Ürünlerimiz için en uygun tedarikçileri burada bulduk. Süreç çok hızlı ve verimli işliyor.",
      avatar: "https://randomuser.me/api/portraits/men/62.jpg"
    }
  ];

  // Hizmetler
  const services = [
    {
      title: "İlan Oluşturma",
      description: "Ürün ve hizmetleriniz için kolayca ilan oluşturun.",
      icon: <LocalOfferIcon fontSize="large" sx={{ color: 'primary.main' }} />
    },
    {
      title: "Ters Açık Artırma",
      description: "Alıcılar için en uygun fiyatlarla teklif alma sistemi.",
      icon: <TimerIcon fontSize="large" sx={{ color: 'primary.main' }} />
    },
    {
      title: "Güvenli İşlem",
      description: "Onaylı firmalar arasında güvenli ticaret.",
      icon: <PersonAddIcon fontSize="large" sx={{ color: 'primary.main' }} />
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.light', 
          color: 'common.white',
          py: 10,
          borderRadius: { md: '0 0 50px 50px' }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                Ters Açık Artırma Platformu
              </Typography>
              <Typography variant="h5" paragraph>
                İşletmelerin tedarik süreçlerinde zaman ve maliyet tasarrufu sağlayan yenilikçi çözüm
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  component={RouterLink}
                  to="/listings"
                  endIcon={<ArrowForward />}
                  sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
                >
                  İlanları Görüntüle
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  component={RouterLink}
                  to="/login"
                >
                  Üye Ol
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box 
                component="img"
                src="/images/hero-image.png"
                alt="Ters Açık Artırma"
                sx={{ 
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  display: 'block',
                  mx: 'auto',
                  borderRadius: 2,
                  boxShadow: 5
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Özellikler Bölümü */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Nasıl Çalışır?
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Platform, işletmeler arasında ters açık artırma sistemi ile en uygun fiyatlı tedarikçileri bulmanızı sağlar.
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {services.map((service, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: 3,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 5
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    {service.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom align="center">
                    {service.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center">
                    {service.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* CTA Bölümü */}
      <Box sx={{ bgcolor: 'secondary.light', py: 8 }}>
        <Container maxWidth="md">
          <Paper 
            elevation={4} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: 'white'
            }}
          >
            <Typography variant="h4" component="h3" fontWeight="bold" gutterBottom>
              Hemen Başlayın!
            </Typography>
            <Typography variant="subtitle1" paragraph>
              İşletmeniz için en uygun tedarikçileri bulmak hiç bu kadar kolay olmamıştı.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              component={RouterLink}
              to="/login"
              sx={{ mt: 2 }}
            >
              Ücretsiz Üye Olun
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 