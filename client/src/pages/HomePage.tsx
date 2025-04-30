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
  alpha
} from '@mui/material';
import { 
  ShoppingCart, 
  GroupAdd, 
  MonetizationOn, 
  AccessTime, 
  ArrowForward, 
  Star,
  CheckCircle
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { on, off } = useSocket();
  
  const [activeListings, setActiveListings] = useState<number>(0);
  const [lastBid, setLastBid] = useState<any>(null);
  const [categories, setCategories] = useState([
    { name: 'Elektrik', count: 0 },
    { name: 'Hırdavat', count: 0 },
    { name: 'Nalburiye', count: 0 },
    { name: 'Yedek Parça', count: 0 },
    { name: 'İnşaat', count: 0 },
    { name: 'Temizlik', count: 0 }
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
        
        // Kategori sayılarını güncelle
        if (categoryData.length > 0) {
          // Her kategori için ilan sayısını getir
          const updatedCategories = await Promise.all(
            categories.map(async (cat) => {
              const catId = categoryData.find(c => c.name === cat.name)?._id;
              if (catId) {
                const catListings = await api.get(`/listings?category=${catId}`);
                return { ...cat, count: catListings.data.length };
              }
              return cat;
            })
          );
          setCategories(updatedCategories);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };
    
    fetchData();
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

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{
          position: 'relative',
          backgroundColor: 'background.paper',
          color: 'text.primary',
          pt: { xs: 6, md: 12 },
          pb: { xs: 8, md: 16 },
          overflow: 'hidden'
        }}
      >
        {/* Arka plan dekoratif elementleri */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -100, 
            right: -100, 
            width: 300, 
            height: 300, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)',
            zIndex: 0 
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: -80, 
            left: -80, 
            width: 200, 
            height: 200, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, rgba(244, 63, 94, 0) 70%)',
            zIndex: 0 
          }} 
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Chip 
                    label="YENİ NESİL TİCARET" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: 'primary.main',
                      fontWeight: 600,
                      borderRadius: 1,
                      mb: 2
                    }} 
                  />
                  <Typography 
                    component="h1" 
                    variant="h2" 
                    fontWeight={800}
                    sx={{ 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      backgroundImage: 'linear-gradient(90deg, #111827, #4F46E5)',
                      backgroundClip: 'text',
                      color: 'transparent',
                      lineHeight: 1.2,
                      mb: 2
                    }}
                  >
                    En Uygun Fiyatları Bulmak İçin <span style={{ color: theme.palette.primary.main }}>Ters Açık Artırma</span>
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 4,
                      lineHeight: 1.6,
                      fontWeight: 400
                    }}
                  >
                    İhtiyaçlarınız için en uygun fiyatları bulun. Satıcılar birbirleriyle rekabet eder, siz kazanırsınız!
                  </Typography>
                </Box>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/listings" 
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      py: 1.5, 
                      px: 3,
                      boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
                    }}
                  >
                    İlanları Görüntüle
                  </Button>
                  <Button 
                    variant="outlined" 
                    component={Link} 
                    to="/login" 
                    size="large"
                    sx={{ py: 1.5, px: 3 }}
                  >
                    Hemen Kayıt Ol
                  </Button>
                </Stack>
                
                <Box sx={{ display: 'flex', mt: 4, pt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                    <Box sx={{ position: 'relative', display: 'flex' }}>
                      {[1, 2, 3].map((i) => (
                        <Avatar 
                          key={i}
                          src={`https://randomuser.me/api/portraits/${i % 2 ? 'men' : 'women'}/${20 + i}.jpg`}
                          sx={{ 
                            width: 34, 
                            height: 34, 
                            border: '2px solid white',
                            ml: i === 1 ? 0 : -1.5 
                          }}
                        />
                      ))}
                    </Box>
                    <Box sx={{ ml: 1.5 }}>
                      <Typography fontWeight={600} variant="body2">5,000+</Typography>
                      <Typography variant="caption" color="text.secondary">Aktif Kullanıcı</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} fontSize="small" />
                      ))}
                    </Box>
                    <Box sx={{ ml: 1.5 }}>
                      <Typography fontWeight={600} variant="body2">4.9/5</Typography>
                      <Typography variant="caption" color="text.secondary">258 Değerlendirme</Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative' }}>
                <Box 
                  component="img"
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=700"
                  alt="İş adamları"
                  sx={{ 
                    width: '100%', 
                    borderRadius: 3, 
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    transform: 'perspective(1500px) rotateY(-5deg)',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'perspective(1500px) rotateY(0deg)',
                    }
                  }}
                />
                
                <Paper
                  elevation={6}
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 200,
                    height: 100,
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    ORTALAMA TASARRUF
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={800} 
                    sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    %28
                  </Typography>
                </Paper>
                
                <Paper
                  elevation={6}
                  sx={{
                    position: 'absolute',
                    top: 40,
                    right: -20,
                    width: 160,
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main', 
                        display: 'inline-block' 
                      }} 
                    />
                    Şu anda aktif
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                    {activeListings} İlan
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              component="h2" 
              variant="h3" 
              fontWeight={700} 
              sx={{ mb: 2 }}
            >
              Nasıl Çalışır?
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto', 
                fontWeight: 400 
              }}
            >
              Ters açık artırma sistemiyle en düşük teklifi vererek kazanın!
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    mb: 3,
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}
                >
                  1
                </Box>
                <Typography 
                  component="h3" 
                  variant="h5" 
                  fontWeight={600} 
                  gutterBottom
                >
                  İlanı Oluştur
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
                  İhtiyacınız olan ürün veya hizmeti detaylarıyla birlikte ilan olarak oluşturun.
                </Typography>
                <Box 
                  component="img"
                  src="https://img.icons8.com/color/96/000000/add-property.png"
                  alt="İlan oluştur"
                  sx={{ width: 70, height: 70, mt: 3, opacity: 0.8 }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.main',
                    mb: 3,
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}
                >
                  2
                </Box>
                <Typography 
                  component="h3" 
                  variant="h5" 
                  fontWeight={600} 
                  gutterBottom
                >
                  Teklifleri Bekle
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Firmalar 6 saat boyunca her yeni teklifte en az %5 daha düşük fiyat verir.
                </Typography>
                <Box 
                  component="img"
                  src="https://img.icons8.com/color/96/000000/auction.png"
                  alt="Teklifleri bekle"
                  sx={{ width: 70, height: 70, mt: 3, opacity: 0.8 }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    mb: 3,
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}
                >
                  3
                </Box>
                <Typography 
                  component="h3" 
                  variant="h5" 
                  fontWeight={600} 
                  gutterBottom
                >
                  Teklifi Kabul Et
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Son teklifi kabul ederek satıcı ile iletişime geçin ve alışverişi tamamlayın.
                </Typography>
                <Box 
                  component="img"
                  src="https://img.icons8.com/color/96/000000/handshake.png"
                  alt="Teklifi kabul et"
                  sx={{ width: 70, height: 70, mt: 3, opacity: 0.8 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              component="h2" 
              variant="h3" 
              fontWeight={700} 
              sx={{ mb: 2 }}
            >
              Platformun Özellikleri
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}
            >
              Ters açık artırma platformuyla alışveriş deneyiminizi dönüştürün
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ p: 3, pb: 2 }}>
                    <Box 
                      sx={{ 
                        display: 'inline-flex',
                        p: 1.5,
                        bgcolor: feature.color,
                        borderRadius: 2,
                        mb: 2
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography gutterBottom variant="h5" component="h3" fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Kategoriler */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography component="h2" variant="h4" fontWeight={700}>
              Popüler Kategoriler
            </Typography>
            <Button 
              component={Link} 
              to="/categories" 
              endIcon={<ArrowForward />}
              sx={{ fontWeight: 600 }}
            >
              Tüm Kategoriler
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            {categories.map((category, index) => (
              <Grid item key={index} xs={6} sm={4} md={2}>
                <Card 
                  component={Link} 
                  to={`/categories/${category.name}`}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    height: 120,
                    textAlign: 'center',
                    borderRadius: 3,
                    textDecoration: 'none',
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {category.name}
                  </Typography>
                  <Chip 
                    label={`${category.count} İlan`} 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      fontWeight: 500
                    }} 
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* Referanslar */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              component="h2" 
              variant="h3" 
              fontWeight={700} 
              sx={{ mb: 2 }}
            >
              Kullanıcılarımız Ne Diyor?
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}
            >
              Ters açık artırma platformumuzla tasarruf eden işletmelerden bazıları
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item key={index} xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    borderRadius: 4,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'visible',
                    '&::before': {
                      content: '"""',
                      position: 'absolute',
                      top: -15,
                      left: 20,
                      fontSize: '7rem',
                      color: alpha(theme.palette.primary.main, 0.08),
                      fontFamily: 'serif',
                      lineHeight: 1,
                      pointerEvents: 'none',
                      zIndex: 0
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={testimonial.avatar} sx={{ width: 56, height: 56 }} />
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{testimonial.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{testimonial.company}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', color: 'warning.main', mb: 2 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} fontSize="small" />
                      ))}
                    </Box>
                    <Typography variant="body1">{testimonial.text}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          py: { xs: 8, md: 12 }, 
          background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Dekoratif elementler */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '-5%', 
            left: '-5%', 
            width: '30%', 
            height: '30%', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
            zIndex: 0 
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: '-10%', 
            right: '-5%', 
            width: '40%', 
            height: '40%', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
            zIndex: 0 
          }} 
        />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography 
            component="h2" 
            variant="h3" 
            fontWeight={700} 
            sx={{ mb: 3 }}
          >
            Hemen Başlayın!
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              maxWidth: 700,
              mx: 'auto'
            }}
          >
            Siz de hemen kayıt olun ve ters açık artırma platformunun avantajlarından yararlanın.
            En iyi teklifleri alın, zamandan ve paradan tasarruf edin.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/login"
            sx={{ 
              py: 1.5, 
              px: 4,
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.9)
              }
            }}
          >
            Ücretsiz Kayıt Ol
          </Button>
        </Container>
      </Box>

      {/* Paper içinde lastBid gösterimi */}
      {lastBid && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 280,
            borderRadius: 2,
            p: 2,
            zIndex: 1000,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 }
            }
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
            YENİ TEKLİF
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>{lastBid.bid.bidder.name}</strong> tarafından 
            <strong> {lastBid.listing.title}</strong> ilanına
          </Typography>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {lastBid.bid.price} TL
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              component={Link} 
              to={`/listings/${lastBid.listing._id}`}
              size="small"
            >
              İncele
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default HomePage; 