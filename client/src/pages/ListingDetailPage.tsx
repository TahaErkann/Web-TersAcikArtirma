import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { getListingById, placeBid, acceptBid } from '../services/listingService';
import { Listing, Bid, User } from '../types';
import {
  Container,
  Typography,
  Paper,
  Grid as MuiGrid,
  Box,
  Button,
  TextField,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import AnimatedComponents from '../components/AnimatedComponents';

const { AnimateOnScroll, AnimatedCard, AnimatedButton } = AnimatedComponents;

// MUI Grid ile ilgili tip hatalarını aşmak için bir wrapper component oluşturuyoruz
const Grid = (props: any) => <MuiGrid {...props} />;

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, off } = useSocket();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [bidAcceptLoading, setBidAcceptLoading] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<User | null>(null);
  
  // İlan detaylarını yükle
  const fetchListing = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("İlan detayı isteği gönderiliyor, ID:", id);
      const data = await getListingById(id, true);
      console.log("İlan verileri (ham):", data);
      console.log("İlan verileri (JSON):", JSON.stringify(data, null, 2));
      
      // Verileri doğrulama
      if (!data || typeof data !== 'object') {
        console.error("API'dan geçersiz veri alındı:", data);
        setError('Sunucudan geçersiz veri alındı.');
        setLoading(false);
        return;
      }
      
      // Kritik alanları kontrol et
      if (!data.title) console.warn("İlan başlık bilgisi eksik");
      if (!data.description) console.warn("İlan açıklama bilgisi eksik");
      if (data.startingPrice === undefined) console.warn("İlan başlangıç fiyatı eksik");
      if (data.currentPrice === undefined) console.warn("İlan güncel fiyat bilgisi eksik");
      if (!data.endDate) console.warn("İlan bitiş tarihi eksik:", data.endDate);
      
      // Bids kontrolü
      if (!Array.isArray(data.bids)) {
        console.warn("İlan teklifleri bir dizi değil, boş dizi ayarlanıyor.");
        data.bids = [];
      } else {
        console.log(`İlanda ${data.bids.length} teklif var.`);
        // Tekliflerin yapısını analiz et
        if (data.bids.length > 0) {
          console.log("İlk teklif örneği:", data.bids[0]);
          data.bids.forEach((bid, index) => {
            if (!bid.amount) console.warn(`Teklif #${index} miktar bilgisi eksik`);
            if (!bid.timestamp) console.warn(`Teklif #${index} tarih bilgisi eksik`);
            if (!bid.user) console.warn(`Teklif #${index} kullanıcı bilgisi eksik`);
          });
        }
      }
      
      setListing(data);
      
      // Başlangıç teklif tutarını mevcut fiyattan biraz daha düşük ayarla
      if (data.currentPrice) {
        setBidAmount((data.currentPrice * 0.95).toFixed(2)); // %5 daha düşük
      } else if (data.startingPrice) {
        setBidAmount((data.startingPrice * 0.95).toFixed(2));
      }
      
      // Eğer ilan süresi dolmuşsa ve hala aktif görünüyorsa durumunu güncelle
      if (data.status === 'active' && data.endDate && new Date(data.endDate) < new Date()) {
        console.log("İlan süresi dolmuş, durum güncellenecek");
        // Bu bilgiyi sadece UI'da göster, backend'den güncel veri geldiğinde otomatik güncellenecek
        setListing({
          ...data,
          status: 'ended'
        });
      }
    } catch (err) {
      console.error("İlan yüklenirken hata:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('İlan bilgileri yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // İlan detaylarını yükle
  useEffect(() => {
    fetchListing();
  }, [id, fetchListing]);
  
  // Kalan zamanı hesapla
  useEffect(() => {
    if (!listing) return;
    
    const calculateTimeLeft = () => {
      try {
        // İlk olarak son geçerlilik tarihini (expiresAt) kullan
        // Bu, teklif verildiğinde güncellenen süre
        let expiryDate;
        
        if (listing.expiresAt) {
          expiryDate = new Date(listing.expiresAt);
        } else if (listing.endDate) {
          expiryDate = new Date(listing.endDate);
        } else {
          console.error("Bitiş tarihi bulunamadı");
          setTimeLeft('Süre bilgisi eksik');
          return;
        }
        
        // Tarih geçerli mi?
        if (isNaN(expiryDate.getTime())) {
          console.error("Geçersiz tarih formatı:", expiryDate);
          setTimeLeft('Geçersiz tarih');
          return;
        }
        
        const now = new Date();
        const difference = expiryDate.getTime() - now.getTime();
        
        console.log("Kalan süre hesaplama:", {
          expiryDate: expiryDate.toISOString(),
          now: now.toISOString(),
          difference
        });
        
        if (difference <= 0) {
          setTimeLeft('Süre doldu');
          return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${days > 0 ? `${days} gün ` : ''}${hours > 0 ? `${hours} saat ` : ''}${minutes} dakika ${seconds} saniye`
        );
      } catch (error) {
        console.error("Kalan süre hesaplanırken hata:", error);
        setTimeLeft('Hesaplanamadı');
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [listing]);
  
  // Socket.io ile gerçek zamanlı güncellemeler
  useEffect(() => {
    if (!id) return;

    // Yeni teklif verildiğinde
    const handleBidPlaced = (data: { listingId: string; bid: Bid }) => {
      if (data.listingId === id && listing) {
        // İlanı güncelle
        setListing({
          ...listing,
          currentPrice: data.bid.amount,
          bids: [...listing.bids, data.bid]
        });
      }
    };
    
    // İlan durumu güncellendiğinde
    const handleListingStatusUpdated = (data: { listingId: string; status: 'active' | 'ended' | 'cancelled' }) => {
      if (data.listingId === id && listing) {
        setListing({
          ...listing,
          status: data.status
        });
      }
    };
    
    on('bidPlaced', handleBidPlaced);
    on('listingStatusUpdated', handleListingStatusUpdated);
    
    return () => {
      off('bidPlaced', handleBidPlaced);
      off('listingStatusUpdated', handleListingStatusUpdated);
    };
  }, [id, listing, on, off]);
  
  const handleBidDialogOpen = () => {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${id}` } });
      return;
    }
    
    setBidDialogOpen(true);
  };
  
  const handleBidDialogClose = () => {
    setBidDialogOpen(false);
    setBidError(null);
  };
  
  const handlePlaceBid = async () => {
    if (!id || !bidAmount || !canPlaceBid()) return;
    
    setBidLoading(true);
    setBidError(null);
    
    try {
      console.log(`Teklif verme isteği gönderiliyor: İlan ID: ${id}, Miktar: ${bidAmount}`);
      
      // Numeric kontrolü
      const numericAmount = parseFloat(bidAmount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setBidError('Geçerli bir teklif miktarı giriniz');
        setBidLoading(false);
        return;
      }
      
      // Mevcut fiyattan düşük mü kontrol et (ters açık artırma)
      if (numericAmount >= safeCurrentPrice) {
        setBidError('Teklifiniz mevcut fiyattan düşük olmalıdır');
        setBidLoading(false);
        return;
      }
      
      const updatedListing = await placeBid(id, numericAmount);
      console.log("Teklif başarılı, güncellenen ilan:", updatedListing);
      
      // API'den gelen verileri doğrula ve gerekirse eski verilerle birleştir
      if (updatedListing && listing) {
        // Mevcut ilan ve güncellenen ilan verilerini birleştir
        const mergedListing = {
          ...listing, // Mevcut tüm verileri koru
          ...updatedListing, // Güncellenen verileri ekle
          
          // Aşağıdaki alanları doğrula, yoksa mevcut ilan verilerini kullan
          title: updatedListing.title || listing.title,
          description: updatedListing.description || listing.description,
          startingPrice: updatedListing.startingPrice || listing.startingPrice,
          currentPrice: updatedListing.currentPrice || listing.currentPrice,
          status: updatedListing.status || listing.status || 'active',
          
          // Eğer API'den dönen bitiş tarihi yok veya geçersizse, mevcut tarihi kullan
          endDate: updatedListing.endDate && new Date(updatedListing.endDate).toString() !== 'Invalid Date' 
            ? updatedListing.endDate : listing.endDate,
            
          // Eğer API'den dönen teklifler yoksa veya geçersizse, mevcut tekliflere yeni teklifi ekle
          bids: Array.isArray(updatedListing.bids) && updatedListing.bids.length > 0 
            ? updatedListing.bids 
            : [...listing.bids, { 
                user: user?._id || '', // user._id, teklif veren kullanıcının ID'si
                amount: numericAmount, 
                timestamp: new Date().toISOString() 
              } as Bid], // Bid tipine cast ediyoruz
        };
        
        console.log("Birleştirilmiş ilan verileri:", mergedListing);
        setListing(mergedListing);
      } else {
        // Eğer API'den veri dönmezse veya sorun olursa, ilan bilgilerini tekrar yükle
        console.log("API'den yeterli veri dönmedi, ilan bilgileri yeniden yükleniyor");
        const refreshedListing = await getListingById(id);
        setListing(refreshedListing);
      }
      
      // Modalı kapat
      setBidDialogOpen(false);
      
      // Yeni bir teklif miktarı ayarla (şimdikinden biraz daha düşük)
      if (updatedListing?.currentPrice) {
        setBidAmount((updatedListing.currentPrice * 0.95).toFixed(2));
      } else if (listing?.currentPrice) {
        setBidAmount((listing.currentPrice * 0.95).toFixed(2));
      }
    } catch (error: any) {
      console.error("Teklif verme hatası:", error);
      console.error("Hata detayları:", {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response && error.response.data && error.response.data.error) {
        setBidError(error.response.data.error);
      } else if (error instanceof Error) {
        setBidError(error.message);
      } else {
        setBidError('Teklif verirken bir hata oluştu');
      }
    } finally {
      setBidLoading(false);
    }
  };
  
  // İlanın süresi doldu mu kontrol et
  const isExpired = () => {
    if (!listing) return false;
    
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
  
  // İlana teklif verme koşullarını kontrol et
  const canPlaceBid = () => {
    if (!user || !listing) return false;
    
    // İlan aktif değilse teklif verilemez
    if (listing.status !== 'active') return false;
    
    // Süresi dolmuşsa teklif verilemez
    if (isExpired()) return false;
    
    // Kendi ilanına teklif veremezsin
    const isOwnListing = 
      (listing.owner && typeof listing.owner === 'object' && listing.owner._id === user._id) ||
      (typeof listing.owner === 'string' && listing.owner === user._id);
    
    if (isOwnListing) return false;
    
    return true;
  };
  
  // Teklifi kabul et
  const handleAcceptBid = async (bidId: string) => {
    if (!listing || !id || !user || bidAcceptLoading) return;
    
    // İlan sahibi değilse işlemi engelle
    const isOwnListing = 
      (listing.owner && typeof listing.owner === 'object' && listing.owner._id === user._id) ||
      (typeof listing.owner === 'string' && listing.owner === user._id);
    
    if (!isOwnListing) {
      alert('Bu işlem için yetkiniz yok. Sadece ilan sahibi teklif kabul edebilir.');
      return;
    }
    
    if (window.confirm('Sadece en düşük fiyat teklifini kabul edebilirsiniz. Kabul ettiğinizde teklif sahibinin iletişim bilgilerine erişebilirsiniz. Bu tekliften daha yüksek olan tüm teklifler otomatik olarak reddedilecektir. Devam etmek istiyor musunuz?')) {
      try {
        setBidAcceptLoading(true);
        await acceptBid(id, bidId);
        alert('Teklif başarıyla kabul edildi. Artık sadece bu teklifin iletişim bilgilerine erişebilirsiniz. Daha yüksek teklifler otomatik olarak reddedildi.');
        
        // İlan detaylarını detaylı bilgilerle yeniden yükle
        console.log("Teklif kabul edildi, detaylı ilanı yeniden yüklüyorum...");
        const updatedListing = await getListingById(id, true);
        console.log("Teklif kabul sonrası ilan (detaylı):", updatedListing);
        
        // Teklif sahibi bilgilerini kontrol et
        const acceptedBid = updatedListing.bids.find(b => b._id === bidId);
        if (acceptedBid) {
          console.log("Kabul edilen teklif:", acceptedBid);
          
          if (typeof acceptedBid.user === 'object' && acceptedBid.user) {
            console.log("Kabul edilen teklif sahibi (user):", acceptedBid.user);
          }
          
          if (typeof acceptedBid.bidder === 'object' && acceptedBid.bidder) {
            console.log("Kabul edilen teklif sahibi (bidder):", acceptedBid.bidder);
          }
        }
        
        // İlanı güncelle
        setListing(updatedListing);
        
      } catch (err: any) {
        console.error('Teklif kabul hatası:', err);
        
        // Hata mesajını göster
        let errorMessage = 'Teklif kabul edilirken bir hata oluştu.';
        if (err.message && typeof err.message === 'string') {
          errorMessage = err.message;
        }
        
        alert('Hata: ' + errorMessage);
      } finally {
        setBidAcceptLoading(false);
      }
    }
  };
  
  // Kullanıcı detayları dialogunu aç
  const handleOpenUserDetails = async (bid: Bid) => {
    // Kullanıcı bilgilerini al
    try {
      console.log("Teklif veren kullanıcı bilgileri (ham):", bid);
      
      // Önce mevcut teklifi geçici olarak göster
      if (typeof bid.user === 'object' && bid.user) {
        setSelectedBidder(bid.user as User);
      } else if (typeof bid.bidder === 'object' && bid.bidder) {
        setSelectedBidder(bid.bidder as User);
      }
      
      // Kullanıcı modalını aç
      setUserDetailsOpen(true);

      // İlanı tam detaylarla yeniden yükle
      if (id) {
        try {
          setLoading(true);
          
          // fullDetails=true parametresi ile tam kullanıcı detaylarını getir
          console.log("Detaylı bilgiler için ilanı yeniden yüklüyorum (fullDetails=true)...");
          const updatedListing = await getListingById(id, true);
          console.log("İlan yeniden yüklendi (fullDetails=true):", updatedListing);
          
          // İlan yüklendiyse, teklifi bul
          if (updatedListing && updatedListing.bids) {
            const updatedBid = updatedListing.bids.find(b => 
              (b._id === bid._id) || 
              (bid._id && b._id?.toString() === bid._id.toString())
            );
            
            if (updatedBid) {
              console.log("Güncellenmiş teklif bilgisi bulundu:", updatedBid);
              
              // Güncellenmiş bid verilerini kullanarak kullanıcı bilgilerini al
              let userDetails: User | null = null;
              
              if (typeof updatedBid.user === 'object' && updatedBid.user) {
                console.log("Kullanıcı bilgileri (user):", updatedBid.user);
                userDetails = updatedBid.user as User;
              } else if (typeof updatedBid.bidder === 'object' && updatedBid.bidder) {
                console.log("Kullanıcı bilgileri (bidder):", updatedBid.bidder);
                userDetails = updatedBid.bidder as User;
              }
              
              if (userDetails) {
                // Teklif veren her kullanıcı onaylıdır
                userDetails.isApproved = true;
                
                console.log("Final kullanıcı bilgileri:", userDetails);
                setSelectedBidder(userDetails);
                
                // Tüm listing'i de güncelle
                setListing(updatedListing);
              }
            }
          }
        } catch (error) {
          console.error("İlan yenilenirken hata oluştu:", error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Kullanıcı bilgileri alınırken hata:", error);
      alert('Kullanıcı bilgileri yüklenirken bir hata oluştu');
    }
  };
  
  // Kullanıcı detayları dialogunu kapat
  const handleCloseUserDetails = () => {
    setUserDetailsOpen(false);
  };

  // Kabul edilmiş teklifi bul
  const getAcceptedBid = (): Bid | null => {
    if (!listing || !Array.isArray(listing.bids)) return null;
    
    const acceptedBid = listing.bids.find(bid => bid.status === 'accepted');
    
    if (acceptedBid) {
      console.log("Kabul edilmiş teklif bulundu:", acceptedBid);
      
      // Kullanıcı bilgilerini kontrol et
      if (typeof acceptedBid.user === 'object' && acceptedBid.user) {
        console.log("Kabul edilmiş teklif kullanıcı bilgileri (user):", {
          id: acceptedBid.user._id,
          name: acceptedBid.user.name || acceptedBid.user.username,
          email: acceptedBid.user.email,
          phone: acceptedBid.user.phone,
          companyInfo: acceptedBid.user.companyInfo
        });
      }
      
      if (typeof acceptedBid.bidder === 'object' && acceptedBid.bidder) {
        console.log("Kabul edilmiş teklif kullanıcı bilgileri (bidder):", {
          id: acceptedBid.bidder._id,
          name: acceptedBid.bidder.name || acceptedBid.bidder.username,
          email: acceptedBid.bidder.email,
          phone: acceptedBid.bidder.phone,
          companyInfo: acceptedBid.bidder.companyInfo
        });
      }
    }
    
    return acceptedBid || null;
  };
  
  // Teklifi kabul eden kullanıcı, teklifi veren kullanıcının bilgilerini görebilir
  const canViewBidderInfo = (bid: Bid): boolean => {
    if (!user || !listing) return false;
    
    // İlan sahibi değilse, bilgileri görüntüleyemez
    const isOwnListing = 
      (listing.owner && typeof listing.owner === 'object' && listing.owner._id === user._id) ||
      (typeof listing.owner === 'string' && listing.owner === user._id);
    
    if (!isOwnListing) return false;
    
    // Teklif kabul edilmişse, bilgileri görüntüleyebilir
    return bid.status === 'accepted';
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error || !listing) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'İlan bulunamadı'}</Alert>
      </Container>
    );
  }
  
  // İlan verisi güvenli mi kontrol et
  const safeStartingPrice = listing.startingPrice || 0;
  const safeCurrentPrice = listing.currentPrice || safeStartingPrice || 0;
  const safeBids = Array.isArray(listing.bids) ? listing.bids : [];
  const safeItems = Array.isArray(listing.items) ? listing.items : [];
  const safeQuantity = listing.quantity || 1;
  const safeUnit = listing.unit || 'Adet';
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={4}>
          {/* İlan başlığı ve durumu */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1">
                {listing.title || 'İsimsiz İlan'}
              </Typography>
              <Chip 
                label={
                  isExpired() ? 'Süresi Doldu' :
                  listing.status === 'active' ? 'Aktif' : 
                  listing.status === 'ended' ? 'Tamamlandı' : 'İptal Edildi'
                }
                color={
                  isExpired() ? 'warning' :
                  listing.status === 'active' ? 'success' : 
                  listing.status === 'ended' ? 'primary' : 'error'
                }
              />
            </Box>
          </Grid>
          
          {/* İlan detayları */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              İlan Detayları
            </Typography>
            
            <Typography paragraph>
              {listing.description || 'Açıklama bulunmuyor.'}
            </Typography>
            
            <Box display="flex" alignItems="center" mb={2}>
              <LocationOnIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {listing.location || 'Belirtilmemiş'}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" mb={2}>
              <TimerIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Kalan Süre: {timeLeft}
              </Typography>
            </Box>
            
            {listing.seller && typeof listing.seller === 'object' && listing.seller.username && (
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Satıcı: {listing.seller.username}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Ürün Listesi */}
            <Typography variant="h6" gutterBottom>
              Ürün Listesi
            </Typography>
            
            {safeItems.length > 0 ? (
              <Box>
                {safeItems.map((item, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{item.name || 'İsimsiz Ürün'}</Typography>
                      {item.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {item.description}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Miktar: {item.quantity || 1} {item.unit || 'Adet'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Miktar: {safeQuantity} {safeUnit}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Teklifler
            </Typography>
            
            {safeBids.length > 0 ? (
              <List>
                {safeBids
                  .slice()
                  .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
                  .map((bid, index) => {
                    // Teklif bilgilerini detaylı loglama
                    console.log("Teklif bilgisi:", {
                      bid: bid,
                      user: bid.user,
                      amount: bid.amount,
                      timestamp: bid.timestamp
                    });
                    
                    // Kullanıcı bilgisi çıkarma
                    let username = 'Bilinmeyen Kullanıcı';
                    if (typeof bid.user === 'object' && bid.user) {
                      username = bid.user.username || 'İsimsiz Kullanıcı';
                    } else if (typeof bid.user === 'string') {
                      username = bid.user;
                    }
                    
                    // Bid status kontrolü
                    const bidStatus = bid.status || 'pending';
                    
                    // İlan sahibiyiz, ilan aktif ve bu teklif pending durumunda
                    const canAcceptBid = user && listing && 
                      ((listing.owner && typeof listing.owner === 'object' && listing.owner._id === user._id) ||
                      (typeof listing.owner === 'string' && listing.owner === user._id)) &&
                      listing.status === 'active' && 
                      bidStatus === 'pending';
                      
                    // Teklif sahibi bilgilerini görüntüleyebiliriz mi?
                    const canSeeUserInfo = canViewBidderInfo(bid);
                    
                    return (
                      <ListItem key={index} divider={index < safeBids.length - 1}>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography component="span">
                                {`${(bid.amount !== undefined && bid.amount !== null) ? 
                                  bid.amount.toFixed(2) : "0.00"} TL`}
                              </Typography>
                              {bidStatus && (
                                <Chip 
                                  size="small" 
                                  label={
                                    bidStatus === 'accepted' ? 'Kabul Edildi' : 
                                    bidStatus === 'rejected' ? 'Reddedildi' : 
                                    bidStatus === 'expired' ? 'Süresi Doldu' : 'Beklemede'
                                  }
                                  color={
                                    bidStatus === 'accepted' ? 'success' : 
                                    bidStatus === 'rejected' ? 'error' : 
                                    bidStatus === 'expired' ? 'warning' : 'default'
                                  }
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={`${username} - ${bid.timestamp ? 
                            new Date(bid.timestamp).toLocaleString('tr-TR') : 'Bilinmeyen tarih'}`}
                        />
                        {canAcceptBid && (
                          <Button 
                            variant="outlined" 
                            color="success" 
                            size="small"
                            onClick={() => handleAcceptBid(bid._id || '')}
                            disabled={bidAcceptLoading}
                          >
                            Kabul Et
                          </Button>
                        )}
                        {canSeeUserInfo && (
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenUserDetails(bid)}
                            title="Teklif sahibi bilgilerini görüntüle"
                          >
                            <InfoIcon />
                          </IconButton>
                        )}
                      </ListItem>
                    );
                  })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Henüz teklif verilmemiş.
              </Typography>
            )}
            
            {/* Kabul edilen teklif varsa, özet bir bilgi kartı göster */}
            {getAcceptedBid() && canViewBidderInfo(getAcceptedBid() as Bid) && (
              <Box mt={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      Kabul Edilen Teklif
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getAcceptedBid()?.amount?.toFixed(2)} TL 
                      {getAcceptedBid()?.timestamp && ` - ${new Date(getAcceptedBid()?.timestamp || '').toLocaleString('tr-TR')}`}
                    </Typography>
                    <Button
                      startIcon={<InfoIcon />}
                      size="small"
                      variant="text"
                      color="primary"
                      onClick={() => getAcceptedBid() && handleOpenUserDetails(getAcceptedBid() as Bid)}
                      sx={{ mt: 1 }}
                    >
                      Teklif Sahibi Bilgilerini Görüntüle
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Grid>
          
          {/* Fiyat ve teklif kısmı */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Teklif Bilgileri
              </Typography>
              
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">
                  Başlangıç Fiyatı
                </Typography>
                <Typography variant="h4">
                  {safeStartingPrice.toFixed(2)} TL
                </Typography>
              </Box>
              
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">
                  Güncel Teklif
                </Typography>
                <Typography variant="h4" color="primary">
                  {safeCurrentPrice.toFixed(2)} TL
                </Typography>
              </Box>
              
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">
                  Teklif Sayısı
                </Typography>
                <Typography variant="h6">
                  {safeBids.length}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleBidDialogOpen}
                disabled={!canPlaceBid()}
                startIcon={<LocalOfferIcon />}
                sx={{ mt: 2 }}
              >
                Teklif Ver
              </Button>
              
              {!canPlaceBid() && (
                <Typography variant="body2" color="error" align="center" sx={{ mt: 1 }}>
                  {!user ? 'Teklif vermek için giriş yapmalısınız.' : 
                   isExpired() ? 'Bu ilan için teklif verme süresi dolmuştur.' : 
                   listing.status !== 'active' ? 'Bu ilan aktif değil.' :
                   'Kendi ilanınıza teklif veremezsiniz.'}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Teklif verme dialog */}
      <Dialog open={bidDialogOpen} onClose={handleBidDialogClose}>
        <DialogTitle>Teklif Ver</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Teklif vereceğiniz tutar, mevcut fiyattan daha düşük olmalıdır. 
            Ters açık artırmada en düşük teklifi veren kazanır.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Teklif Tutarı (TL)"
            type="number"
            fullWidth
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            inputProps={{ step: '0.01', min: '0' }}
            error={!!bidError}
            helperText={bidError}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBidDialogClose} color="primary">
            İptal
          </Button>
          <Button onClick={handlePlaceBid} color="primary" disabled={bidLoading}>
            {bidLoading ? <CircularProgress size={24} /> : 'Teklif Ver'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Kullanıcı detayları dialog */}
      <Dialog
        open={userDetailsOpen}
        onClose={handleCloseUserDetails}
        aria-labelledby="user-details-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="user-details-dialog-title" sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6">Teklif Sahibi Bilgileri</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {selectedBidder ? (
            <Grid container spacing={3}>
              {/* Kişisel Bilgiler */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', 
                    borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                    Kişisel Bilgiler
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">İsim</Typography>
                        <Typography variant="body1">
                          {selectedBidder.name || 
                           selectedBidder.username || 
                           (selectedBidder as any).fullName || 
                           'Belirtilmemiş'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {selectedBidder.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">E-posta</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ mr: 1 }}>{selectedBidder.email}</Typography>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => window.open(`mailto:${selectedBidder.email}`, '_blank')}
                              title="E-posta gönder"
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    {(selectedBidder.phone || (selectedBidder as any).phoneNumber) && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Telefon</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ mr: 1 }}>
                              {selectedBidder.phone || (selectedBidder as any).phoneNumber}
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => window.open(`tel:${selectedBidder.phone || (selectedBidder as any).phoneNumber}`, '_blank')}
                              title="Ara"
                            >
                              <PhoneIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    {(selectedBidder.address || 
                      (selectedBidder as any).addressLine ||
                      (selectedBidder as any).location) && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <LocationOnIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Adres</Typography>
                          <Typography variant="body1">
                            {selectedBidder.address || 
                             (selectedBidder as any).addressLine || 
                             (selectedBidder as any).location}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<PersonIcon />}
                        label={selectedBidder.isApproved ? "Onaylı Kullanıcı" : "Onaylanmamış Kullanıcı"}
                        color={selectedBidder.isApproved ? "success" : "default"}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Firma Bilgileri */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', 
                    borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                    Firma Bilgileri
                  </Typography>
                  
                  {selectedBidder.companyInfo && Object.keys(selectedBidder.companyInfo).some(key => 
                    selectedBidder.companyInfo && selectedBidder.companyInfo[key as keyof typeof selectedBidder.companyInfo]) ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedBidder.companyInfo.companyName && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Firma Adı</Typography>
                            <Typography variant="body1">{selectedBidder.companyInfo.companyName}</Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedBidder.companyInfo.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LocationOnIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Firma Adresi</Typography>
                            <Typography variant="body1">
                              {selectedBidder.companyInfo.address}
                              {selectedBidder.companyInfo.city && `, ${selectedBidder.companyInfo.city}`}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedBidder.companyInfo && selectedBidder.companyInfo.city && !selectedBidder.companyInfo.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <LocationOnIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Şehir</Typography>
                            <Typography variant="body1">{selectedBidder.companyInfo.city}</Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedBidder.companyInfo.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Firma Telefonu</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" sx={{ mr: 1 }}>{selectedBidder.companyInfo.phone}</Typography>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => window.open(`tel:${selectedBidder.companyInfo?.phone}`, '_blank')}
                                title="Ara"
                              >
                                <PhoneIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedBidder.companyInfo.taxNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Vergi No</Typography>
                            <Typography variant="body1">{selectedBidder.companyInfo.taxNumber}</Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedBidder.companyInfo.description && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <InfoIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Firma Açıklaması</Typography>
                            <Typography variant="body1">{selectedBidder.companyInfo.description}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Firma bilgisi bulunmuyor
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Hesap Bilgileri */}
              {(selectedBidder.createdAt || selectedBidder.updatedAt) && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', 
                      borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                      Hesap Bilgileri
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {selectedBidder.createdAt && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Kayıt Tarihi:</strong> {new Date(selectedBidder.createdAt).toLocaleString('tr-TR')}
                          </Typography>
                        </Grid>
                      )}
                      
                      {selectedBidder.updatedAt && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>Son Güncelleme:</strong> {new Date(selectedBidder.updatedAt).toLocaleString('tr-TR')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="warning" sx={{ my: 2 }}>
              Kullanıcı bilgileri bulunamadı veya görüntüleme yetkiniz yok.
            </Alert>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Bu bilgilere sadece ilanın sahibi erişebilir.
          </Typography>
          <Button 
            onClick={handleCloseUserDetails} 
            variant="contained" 
            color="primary"
            startIcon={<PersonIcon />}
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ListingDetailPage; 