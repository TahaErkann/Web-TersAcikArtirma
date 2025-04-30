import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createListing } from '../services/listingService';
import { getAllCategories } from '../services/categoryService';
import { useSocket } from '../context/SocketContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Grid as MuiGrid,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { tr } from 'date-fns/locale';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Category } from '../types';

// MUI Grid ile ilgili tip hatalarını aşmak için bir wrapper component oluşturuyoruz
const Grid = (props: any) => <MuiGrid {...props} />;

// Ölçü birimi seçenekleri
const unitOptions = [
  'Adet',
  'Metre',
  'Kg',
  'Litre',
  'Set',
  'Paket',
  'Çift'
];

// Ürün tipini tanımla
interface Item {
  name: string;
  quantity: number;
  unit: string;
  description: string;
}

const CreateListingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { on } = useSocket();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    endDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 saat sonrası
    images: [] as string[],
    location: ''
  });

  // Ürün listesi state'i
  const [items, setItems] = useState<Item[]>([
    { name: '', quantity: 1, unit: 'Adet', description: '' }
  ]);

  // Kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error('Kategoriler yüklenirken hata oluştu:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Kullanıcı girişi yapılmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/create-listing' } });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setFormData({ ...formData, endDate: newDate });
    }
  };

  // Ürün bilgisi değiştirme fonksiyonu
  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Yeni ürün ekleme fonksiyonu
  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'Adet', description: '' }]);
  };

  // Ürün silme fonksiyonu
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // İlk ürünün adı boşsa hatayı engelle
      if (!items[0].name.trim()) {
        setError('En az bir ürün adı girmelisiniz');
        setLoading(false);
        return;
      }
      
      // Form verilerini uygun formata dönüştür
      const listingData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        initialMaxPrice: parseFloat(formData.startingPrice),
        startingPrice: parseFloat(formData.startingPrice),
        currentPrice: parseFloat(formData.startingPrice), // Başlangıçta aynı
        endDate: formData.endDate.toISOString(),
        expiresAt: formData.endDate.toISOString(),
        images: formData.images,
        location: formData.location,
        items: items.filter(item => item.name.trim() !== ''), // Boş ürünleri filtrele
        // Ana ürün bilgisini ilk üründen al
        quantity: items[0].quantity,
        unit: items[0].unit,
        status: 'active' as 'active' | 'ended' | 'cancelled'
      };
      
      // İlanı oluştur
      const newListing = await createListing(listingData);
      
      // Başarılı olduktan sonra bildirimi göster ve hemen yönlendir
      setSuccess(true);
      navigate(`/listings/${newListing._id}`);
      
    } catch (error: any) {
      console.error('İlan oluşturma hatası:', error);
      let errorMessage = 'İlan oluşturulurken bir hata oluştu';
      
      if (error.response) {
        // Sunucu hatası
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Socket dinleyicileri
  useEffect(() => {
    // Yeni ilan oluşturulduğunda
    on('newListing', (listing) => {
      console.log('Yeni ilan oluşturuldu:', listing);
    });

    // Component unmount olduğunda dinleyicileri temizle
    return () => {
      // Socket dinleyicileri burada temizlenebilir
    };
  }, [on]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Yeni İlan Oluştur
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="İlan Başlığı"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="İlan Açıklaması"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="category"
                label="Kategori"
                value={formData.category}
                onChange={handleChange}
                select
                fullWidth
                required
                disabled={loadingCategories}
              >
                {loadingCategories ? (
                  <MenuItem disabled>Kategoriler yükleniyor...</MenuItem>
                ) : (
                  categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="location"
                label="Konum"
                value={formData.location}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="startingPrice"
                label="Başlangıç Fiyatı (TL)"
                value={formData.startingPrice}
                onChange={handleChange}
                type="number"
                fullWidth
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DateTimePicker
                  label="Bitiş Tarihi"
                  value={formData.endDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ürün Listesi
              </Typography>
              
              {items.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ürün Adı"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          fullWidth
                          required={index === 0}
                        />
                      </Grid>
                      
                      <Grid item xs={4} sm={2}>
                        <TextField
                          label="Miktar"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                          fullWidth
                          required={index === 0}
                          InputProps={{ inputProps: { min: 1, step: 1 } }}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Birim"
                          select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          fullWidth
                          required={index === 0}
                        >
                          {unitOptions.map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={2} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1 && index === 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          label="Ürün Açıklaması"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />} 
                onClick={handleAddItem}
                sx={{ mt: 1 }}
              >
                Ürün Ekle
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'İlanı Oluştur'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success">İlanınız başarıyla oluşturuldu!</Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateListingPage; 