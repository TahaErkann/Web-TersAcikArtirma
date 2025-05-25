import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Button
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getUserBids } from '../services/bidService';

interface MyBid {
  _id: string;
  amount: number;
  createdAt: string;
  listing: {
    _id: string;
    title: string;
    description: string;
    category: any;
    startingPrice: number;
    currentPrice: number;
    endDate: string;
    status: string;
  };
}

const MyBidsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyBids();
  }, [user, navigate]);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const data = await getUserBids();
      setBids(data || []);
    } catch (err) {
      console.error('Teklifler yüklenirken hata:', err);
      setError('Teklifler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getBidStatus = (bid: MyBid) => {
    if (!bid || !bid.listing) {
      return { 
        label: 'Bilinmeyen', 
        color: 'default' as const, 
        icon: <Cancel />
      };
    }

    const now = new Date();
    const endDate = new Date(bid.listing.endDate);
    const isExpired = endDate < now;
    const isWinning = bid.amount === bid.listing.currentPrice;
    const isActive = bid.listing.status === 'active';

    if (!isActive) {
      return { 
        label: 'İlan Pasif', 
        color: 'default' as const, 
        icon: <Cancel />
      };
    } else if (isExpired) {
      if (isWinning) {
        return { 
          label: 'Kazandı', 
          color: 'success' as const, 
          icon: <CheckCircle />
        };
      } else {
        return { 
          label: 'Kaybetti', 
          color: 'error' as const, 
          icon: <Cancel />
        };
      }
    } else {
      if (isWinning) {
        return { 
          label: 'Önde', 
          color: 'success' as const, 
          icon: <TrendingUp />
        };
      } else {
        return { 
          label: 'Geride', 
          color: 'warning' as const, 
          icon: <TrendingDown />
        };
      }
    }
  };

  const getTimeRemaining = (endDateString: string) => {
    if (!endDateString) {
      return 'Tarih Belirtilmemiş';
    }

    const now = new Date();
    const endDate = new Date(endDateString);
    
    // Invalid date kontrolü
    if (isNaN(endDate.getTime())) {
      return 'Geçersiz Tarih';
    }
    
    const timeLeft = endDate.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return 'Süresi Dolmuş';
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} gün ${hours} saat`;
    } else if (hours > 0) {
      return `${hours} saat`;
    } else {
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} dakika`;
    }
  };

  if (!user) {
    return null;
  }

  if (!user.isApproved) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Firma Onayı Bekleniyor
          </Typography>
          <Typography>
            Teklif verebilmek için önce firma bilgilerinizin onaylanması gerekmektedir.
            Lütfen profil sayfanızdan firma bilgilerinizi tamamlayın.
          </Typography>
          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            onClick={() => navigate('/profile')}
          >
            Profil Sayfası
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Tekliflerim
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verdiğiniz teklifleri takip edin ve sonuçları görün
        </Typography>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {bids.length === 0 ? (
            <Paper
              sx={{
                textAlign: 'center',
                py: 8,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Henüz Teklif Vermediniz
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  İlanları inceleyerek teklif vermeye başlayabilirsiniz.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/listings')}
                sx={{ borderRadius: 2 }}
              >
                İlanları İncele
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {bids
                .filter(bid => bid && bid.listing)
                .map((bid) => {
                const bidStatus = getBidStatus(bid);
                
                return (
                  <Card
                    key={bid._id}
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip
                          icon={bidStatus.icon}
                          label={bidStatus.label}
                          color={bidStatus.color}
                          size="small"
                        />
                      </Box>

                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {bid.listing.title || 'İlan Başlığı'}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {bid.listing.description || 'Açıklama bulunmuyor'}
                      </Typography>

                      <Chip
                        label={typeof bid.listing.category === 'string' ? bid.listing.category : bid.listing.category?.name || 'Kategori'}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />

                      <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Verdiğim Teklif
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight={600}
                            color={bid.amount === bid.listing.currentPrice ? 'success.main' : 'text.primary'}
                          >
                            {formatPrice(bid.amount || 0)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Güncel En Düşük
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatPrice(bid.listing.currentPrice || 0)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Başlangıç Fiyatı
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatPrice(bid.listing.startingPrice || 0)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Kalan Süre
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight={600}
                            color={new Date(bid.listing.endDate) < new Date() ? 'text.secondary' : 'warning.main'}
                          >
                            {getTimeRemaining(bid.listing.endDate)}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/listings/${bid.listing._id}`)}
                        >
                          İlanı Görüntüle
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default MyBidsPage; 