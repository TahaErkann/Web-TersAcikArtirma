//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Snackbar, 
  Alert, 
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Business, 
  LocationOn, 
  Phone, 
  Description, 
  Badge, 
  Save,
  CheckCircle,
  ErrorOutline,
  Info,
  Email
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, getCurrentUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface ProfileFormData {
  companyName: string;
  address: string;
  city: string;
  phone: string;
  taxNumber: string;
  description: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    companyName: user?.companyInfo?.companyName || '',
    address: user?.companyInfo?.address || '',
    city: user?.companyInfo?.city || '',
    phone: user?.companyInfo?.phone || '',
    taxNumber: user?.companyInfo?.taxNumber || '',
    description: user?.companyInfo?.description || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Kullanıcı bilgilerini güncelleme fonksiyonu
  const refreshUserData = async () => {
    try {
      setRefreshing(true);
      const freshUserData = await getCurrentUser();
      updateUser(freshUserData);
      
      // Form verilerini de güncelle
      setFormData({
        companyName: freshUserData?.companyInfo?.companyName || '',
        address: freshUserData?.companyInfo?.address || '',
        city: freshUserData?.companyInfo?.city || '',
        phone: freshUserData?.companyInfo?.phone || '',
        taxNumber: freshUserData?.companyInfo?.taxNumber || '',
        description: freshUserData?.companyInfo?.description || ''
      });
      
      console.log('Kullanıcı bilgileri yenilendi:', freshUserData);
    } catch (err) {
      console.error('Kullanıcı bilgileri yenilenirken hata:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Sayfa yüklendiğinde kullanıcı bilgilerini güncelle
  useEffect(() => {
    refreshUserData();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await updateProfile(formData);
      updateUser(updatedUser);
      setSuccess(true);
      
      // Bilgileri güncellediğimiz için verileri yenile
      await refreshUserData();
      
      // Onay beklemedeyse bilgi mesajı göster
      if (!updatedUser.isApproved && !updatedUser.isRejected) {
        setError('Firma bilgileriniz kaydedildi. Admin onayı bekleniyor.');
      }
      
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <Box sx={{ py: { xs: 5, md: 8 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Sol taraf - Profil özeti */}
          <Grid lg={4} sm={12}>
            <Stack spacing={3}>
              {/* Profil kartı */}
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3, 
                  overflow: 'visible',
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box 
                  sx={{ 
                    height: 80, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1) 
                  }}
                />
                <CardContent 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    pb: 3,
                    position: 'relative'
                  }}
                >
                  <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{
                      width: 100,
                      height: 100,
                      border: '4px solid white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      marginTop: -7,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {user.name[0]}
                  </Avatar>
                  
                  <Typography variant="h5" fontWeight={600} sx={{ mt: 2 }}>
                    {user.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user.email}
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    {user.isApproved ? (
                      <Chip 
                        icon={<CheckCircle fontSize="small" />} 
                        label="Onaylı Firma" 
                        color="success" 
                        variant="outlined" 
                        size="small" 
                      />
                    ) : user.isRejected ? (
                      <Chip 
                        icon={<ErrorOutline fontSize="small" />} 
                        label="Reddedildi" 
                        color="error" 
                        variant="outlined" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        icon={<Info fontSize="small" />} 
                        label="Onay Bekliyor" 
                        color="info" 
                        variant="outlined" 
                        size="small" 
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Firma bilgileri özeti kartı */}
              {user.companyInfo && Object.values(user.companyInfo).some(value => value) && (
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3, 
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Firma Bilgileri
                    </Typography>
                    
                    {user.companyInfo.companyName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Business fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                        <Typography variant="body2">
                          {user.companyInfo.companyName}
                        </Typography>
                      </Box>
                    )}
                    
                    {user.companyInfo.address && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <LocationOn fontSize="small" sx={{ color: 'info.main', mr: 1 }} />
                        <Typography variant="body2">
                          {user.companyInfo.address}
                          {user.companyInfo.city && `, ${user.companyInfo.city}`}
                        </Typography>
                      </Box>
                    )}
                    
                    {user.companyInfo.taxNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Badge fontSize="small" sx={{ color: 'secondary.main', mr: 1 }} />
                        <Typography variant="body2">
                          VN: {user.companyInfo.taxNumber}
                        </Typography>
                      </Box>
                    )}
                    
                    {user.companyInfo.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Phone fontSize="small" sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body2">
                          {user.companyInfo.phone}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Onay durumu kartı */}
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 3, 
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Hesap Durumu
                  </Typography>
                  
                  {user.isRejected && (
                    <Alert 
                      severity="error" 
                      icon={<ErrorOutline />}
                      sx={{ 
                        mt: 1, 
                        mb: 1,
                        borderRadius: 2,
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Firma bilgileriniz reddedildi
                      </Typography>
                      <Typography variant="body2">
                        Sebep: {user.rejectionReason || 'Belirtilmemiş'}
                      </Typography>
                    </Alert>
                  )}
                  
                  {!user.isApproved && !user.isRejected && (
                    <Alert 
                      severity="info"
                      icon={<Info />}
                      sx={{ 
                        mt: 1, 
                        mb: 1,
                        borderRadius: 2,
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Firma onayı bekleniyor
                      </Typography>
                      <Typography variant="body2">
                        Bilgileriniz inceleniyor. Onaylandıktan sonra ilan oluşturabilir ve tekliflerde bulunabilirsiniz.
                      </Typography>
                    </Alert>
                  )}
                  
                  {user.isApproved && (
                    <Alert 
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{ 
                        mt: 1, 
                        mb: 1,
                        borderRadius: 2,
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Firma onaylandı
                      </Typography>
                      <Typography variant="body2">
                        İlan oluşturabilir ve tekliflerde bulunabilirsiniz.
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      color={user.isApproved ? "success" : user.isRejected ? "error" : "info"}
                      fullWidth 
                      size="small"
                      disabled={!user.isRejected}
                      onClick={() => document.getElementById('companyInfo').scrollIntoView({ behavior: 'smooth' })}
                    >
                      {user.isApproved ? "Bilgileri Güncelle" : user.isRejected ? "Düzenle ve Tekrar Gönder" : "Onay Bekleniyor"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          
          {/* Sağ taraf - Form */}
          <Grid lg={8} sm={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Profil Bilgileri
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Firma bilgilerinizi güncelleyerek platformumuzu kullanmaya başlayabilirsiniz. Bilgileriniz admin onayından sonra aktif olacaktır.
                </Typography>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Kullanıcı Bilgileri
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid md={6} xs={12}>
                      <TextField
                        fullWidth
                        disabled
                        label="Ad Soyad"
                        value={user.name}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main'
                                }}
                              >
                                {user.name[0]}
                              </Avatar>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid md={6} xs={12}>
                      <TextField
                        fullWidth
                        disabled
                        label="E-posta"
                        value={user.email}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 4 }} id="companyInfo">
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Firma Bilgileri
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid md={6} xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Firma Adı"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business fontSize="small" sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid md={6} xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Vergi Numarası"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge fontSize="small" sx={{ color: 'secondary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Adres"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn fontSize="small" sx={{ color: 'info.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid md={6} xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Şehir"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn fontSize="small" sx={{ color: 'info.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid md={6} xs={12}>
                      <TextField
                        required
                        fullWidth
                        label="Telefon"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        variant="outlined"
                        placeholder="0 (5XX) XXX XX XX"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone fontSize="small" sx={{ color: 'success.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid xs={12}>
                      <TextField
                        fullWidth
                        label="Firma Açıklaması"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Firmanız hakkında kısa bir açıklama..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Description fontSize="small" sx={{ color: 'warning.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ py: 1.5, px: 4 }}
                          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        >
                          {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Profil bilgileri başarıyla güncellendi!
        </Alert>
      </Snackbar>
      
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="info">
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default ProfilePage; 