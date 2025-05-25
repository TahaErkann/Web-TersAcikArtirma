import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Stack
} from '@mui/material';
import {
  Add,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getUserListings } from '../services/listingService';
import { Listing } from '../types';

const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyListings();
  }, [user, navigate]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const data = await getUserListings();
      setListings(data || []);
    } catch (err) {
      console.error('İlanlar yüklenirken hata:', err);
      setError('İlanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getStatusChip = (listing: Listing) => {
    const now = new Date();
    const endDate = new Date(listing.endDate);
    const isExpired = endDate < now;
    const isActive = listing.status === 'active';

    if (!isActive) {
      return <Chip icon={<Cancel />} label="Pasif" color="default" size="small" />;
    } else if (isExpired) {
      return <Chip icon={<Schedule />} label="Süresi Dolmuş" color="warning" size="small" />;
    } else {
      return <Chip icon={<CheckCircle />} label="Aktif" color="success" size="small" />;
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
            İlan oluşturabilmek için önce firma bilgilerinizin onaylanması gerekmektedir.
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            İlanlarım
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/create-listing')}
            sx={{ borderRadius: 2 }}
          >
            Yeni İlan Oluştur
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Oluşturduğunuz ilanları yönetin ve teklifleri takip edin
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
          {listings.length === 0 ? (
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
                  Henüz İlan Oluşturmadınız
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  İlk ilanınızı oluşturarak ters açık artırma sürecini başlatabilirsiniz.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/create-listing')}
                sx={{ borderRadius: 2 }}
              >
                İlk İlanımı Oluştur
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {listings.map((listing) => (
                <Card
                  key={listing._id}
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
                      <Box sx={{ flex: 1 }}>
                        {getStatusChip(listing)}
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {listing.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {listing.description}
                    </Typography>

                    <Chip
                      label={typeof listing.category === 'string' ? listing.category : listing.category.name}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Başlangıç Fiyatı
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatPrice(listing.startingPrice)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Güncel Fiyat
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight={600}
                          color={listing.currentPrice < listing.startingPrice ? 'success.main' : 'text.primary'}
                        >
                          {formatPrice(listing.currentPrice)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Teklif Sayısı
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {listing.bids.length} teklif
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Bitiş Tarihi
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDate(listing.endDate)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/listings/${listing._id}`)}
                      >
                        Detayları Gör
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default MyListingsPage; 