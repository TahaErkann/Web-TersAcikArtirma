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
          bgcolor: 'primary.main', 
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
              <Typography variant="body1" paragraph sx={{ backgroundColor: alpha('#fff', 0.1), p: 2, borderRadius: 2, mb: 3 }}>
                <strong>Ters Açık Artırma</strong> sisteminde, tedarikçiler en düşük fiyat teklifini vererek rekabet eder. Böylece 
                işletmeler en uygun maliyetle tedarik yapabilir. Normal açık artırmalarda fiyat sürekli 
                yükselirken, ters açık artırmada fiyatlar düşer.
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
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800"
                alt="İş Anlaşması"
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
      
      {/* Platform İstatistikleri */}
      <Container maxWidth="lg" sx={{ my: 6, py: 2 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">{activeListings}</Typography>
              <Typography variant="subtitle1">Aktif İlan</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">{categories.length}</Typography>
              <Typography variant="subtitle1">Farklı Kategori</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">%25</Typography>
              <Typography variant="subtitle1">Ortalama Tasarruf</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Artırma Süreci İllüstrasyonu */}
      <Box sx={{ bgcolor: '#f5f5f5', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" fontWeight="bold" textAlign="center" gutterBottom>
            Ters Açık Artırma Nasıl İşler?
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 5, maxWidth: 700, mx: 'auto' }}>
            Geleneksel açık artırmaların aksine, ters açık artırmada teklifler giderek azalır ve 
            en düşük teklifi veren kazanır.
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box 
                component="img"
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800"
                alt="Grafik gösterimi"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: 3
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>1</Avatar>
                  <Typography>
                    <strong>İlan Yayınlama:</strong> Alıcı, ihtiyaç duyduğu ürün/hizmet için bir başlangıç fiyatı belirleyerek ilan oluşturur.
                  </Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>2</Avatar>
                  <Typography>
                    <strong>Teklif Verme:</strong> Tedarikçiler belirlenen süre içinde birbirlerinin tekliflerini görerek daha düşük teklifler sunar.
                  </Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>3</Avatar>
                  <Typography>
                    <strong>Kazanan Belirleme:</strong> Süre sonunda en düşük teklifi veren tedarikçi kazanır ve alıcı ile iletişime geçer.
                  </Typography>
                </Paper>
                <Paper elevation={1} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>4</Avatar>
                  <Typography>
                    <strong>İşlem Tamamlama:</strong> Alıcı ve satıcı anlaşmayı tamamlar ve platform üzerinden işlem kaydedilir.
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Özellikler Bölümü */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
            Platformun Avantajları
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            İşletmenizin tedarik süreçlerini optimize ederek zaman ve maliyet tasarrufu sağlayın.
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
      
      {/* Kimler İçin İdeal */}
      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" fontWeight="bold" textAlign="center" gutterBottom>
            Kimler İçin İdeal?
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600"
                  alt="Tedarikçiler"
                />
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Tedarikçiler İçin
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • Yeni müşterilere ulaşma ve pazar payınızı artırma
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • Rekabetçi teklif sunarak stok erime hızını artırma
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • İşletmeler arası güvenli ticaret yapma
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600"
                  alt="Alıcılar"
                />
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Alıcılar İçin
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • Tedarik maliyetlerinde %25'e varan tasarruf
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • Geniş tedarikçi ağı ile daha fazla seçenek
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    • Hızlı ve şeffaf tedarik süreci yönetimi
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* CTA Bölümü */}
      <Box sx={{ bgcolor: 'primary.dark', py: 8 }}>
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