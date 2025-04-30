import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getAllListings, getActiveListings } from '../services/listingService';
import { Listing } from '../types';
import {
  Container,
  Typography,
  Grid as MuiGrid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';

// MUI Grid ile ilgili tip hatalarını aşmak için bir wrapper component oluşturuyoruz
const Grid = (props: any) => <MuiGrid {...props} />;

// Özel stiller
const ListingCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const CardMediaStyled = styled(CardMedia)({
  height: 180,
  backgroundSize: 'cover',
});

enum ListingFilter {
  ALL = 'all',
  ACTIVE = 'active'
}

const ListingsPage: React.FC = () => {
  const { on } = useSocket();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingFilter>(ListingFilter.ACTIVE);
  
  // İlanları yükle
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let data;
        if (filter === ListingFilter.ACTIVE) {
          data = await getActiveListings();
        } else {
          data = await getAllListings();
        }
        
        setListings(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('İlanlar yüklenirken bir hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [filter]);
  
  // Socket dinleyicileri
  useEffect(() => {
    // Yeni ilan eklendiğinde
    const handleNewListing = (newListing: Listing) => {
      setListings(prevListings => [newListing, ...prevListings]);
    };
    
    // İlan güncellendiğinde
    const handleListingUpdated = (updatedListing: Listing) => {
      setListings(prevListings => 
        prevListings.map(listing => 
          listing._id === updatedListing._id ? updatedListing : listing
        )
      );
    };
    
    // İlan silindiğinde
    const handleListingDeleted = (listingId: string) => {
      setListings(prevListings => 
        prevListings.filter(listing => listing._id !== listingId)
      );
    };
    
    on('newListing', handleNewListing);
    on('listingUpdated', handleListingUpdated);
    on('listingDeleted', handleListingDeleted);
    
    return () => {
      // Socket dinleyicileri temizle
    };
  }, [on]);
  
  const handleFilterChange = (_event: React.SyntheticEvent, newValue: ListingFilter) => {
    setFilter(newValue);
  };
  
  // İlan durumuna göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'ended': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  // İlan durumuna göre etiket belirleme
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'ended': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          İlanlar
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/create-listing"
        >
          Yeni İlan Oluştur
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={filter} onChange={handleFilterChange}>
          <Tab label="Aktif İlanlar" value={ListingFilter.ACTIVE} />
          <Tab label="Tüm İlanlar" value={ListingFilter.ALL} />
        </Tabs>
      </Box>
      
      {listings.length === 0 ? (
        <Alert severity="info">
          Bu kriterlere uygun ilan bulunamadı.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {listings.map((listing) => (
            <Grid item key={listing._id} xs={12} sm={6} md={4}>
              <ListingCard>
                <CardActionArea component={RouterLink} to={`/listings/${listing._id}`}>
                  <CardMediaStyled
                    image={listing.images && listing.images.length > 0 
                      ? listing.images[0] 
                      : 'https://via.placeholder.com/300x180?text=Ters+Açık+Artırma'}
                    title={listing.title}
                  />
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" component="div" noWrap>
                        {listing.title}
                      </Typography>
                      <Chip 
                        size="small"
                        label={getStatusLabel(listing.status)}
                        color={getStatusColor(listing.status) as any}
                      />
                    </Box>
                    
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      {listing.location}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}>
                      {listing.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" color="text.secondary">
                        Mevcut Fiyat:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {listing.currentPrice?.toFixed(2)} TL
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </ListingCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ListingsPage; 