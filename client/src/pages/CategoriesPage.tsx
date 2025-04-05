import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Card, CardContent, 
  CardMedia, CardActionArea, Box, CircularProgress,
  useTheme, alpha
} from '@mui/material';
import { Category } from '../types';
import { getAllCategories } from '../services/categoryService';

// Kategori simge URL'leri
const categoryIcons: Record<string, string> = {
  'Hırdavat/Nalbur': 'https://cdn-icons-png.flaticon.com/512/2947/2947656.png',
  'Elektrik': 'https://cdn-icons-png.flaticon.com/512/2947/2947969.png',
  'Oto Parça': 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png',
  'Ahşap': 'https://cdn-icons-png.flaticon.com/512/2537/2537535.png',
  'Boya': 'https://cdn-icons-png.flaticon.com/512/1648/1648768.png',
  'Tesisat': 'https://cdn-icons-png.flaticon.com/512/1791/1791961.png',
  'Giyim': 'https://cdn-icons-png.flaticon.com/512/863/863684.png',
  'Gıda': 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png',
  'Kırtasiye': 'https://cdn-icons-png.flaticon.com/512/2541/2541988.png',
  'İnşaat Malzemeleri': 'https://cdn-icons-png.flaticon.com/512/1669/1669341.png',
  'Tarım ve Bahçecilik': 'https://cdn-icons-png.flaticon.com/512/862/862039.png',
  'Medikal ve Laboratuvar': 'https://cdn-icons-png.flaticon.com/512/2376/2376100.png',
  'Temizlik ve Hijyen': 'https://cdn-icons-png.flaticon.com/512/995/995053.png'
};

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError('Kategoriler yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error('Kategori yükleme hatası:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/listings?category=${categoryId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" fontWeight="bold" 
        sx={{ mb: 4, color: theme.palette.primary.main }}>
        Kategoriler
      </Typography>
      
      <Box sx={{ 
        width: '100%', 
        maxWidth: '60px', 
        height: '4px', 
        backgroundColor: theme.palette.secondary.main,
        margin: '0 auto',
        mb: 6
      }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', margin: -2 }}>
        {categories.map((category) => (
          <Box key={category._id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, padding: 2 }}>
            <CardActionArea onClick={() => handleCategoryClick(category._id)}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  },
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      objectFit: 'contain',
                    }}
                    image={categoryIcons[category.name] || 'https://cdn-icons-png.flaticon.com/512/1178/1178479.png'}
                    alt={category.name}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography gutterBottom variant="h5" component="h2" fontWeight="bold">
                    {category.name}
                  </Typography>
                  {category.description && (
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </CardActionArea>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default CategoriesPage; 