// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid,
  useTheme,
  alpha,
  Card,
  Stack,
  Alert,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowForward, Email, Person, Lock } from '@mui/icons-material';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Tab panel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LoginPage: React.FC = () => {
  const { user, login, register, error: authError } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const searchParams = new URLSearchParams(location.search);
  const serverError = searchParams.get('error');
  
  // Form değerleri
  const [tabValue, setTabValue] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Form hata mesajları
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth context'ten gelen hatalar için efect
  useEffect(() => {
    if (authError) {
      if (tabValue === 0) {
        setLoginError(authError);
      } else {
        setRegisterError(authError);
      }
    }
  }, [authError, tabValue]);
  
  // Tab değişikliği
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Tab değiştiğinde hata mesajlarını temizle
    setLoginError('');
    setRegisterError('');
  };
  
  // Giriş işlemi
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Lütfen tüm alanları doldurun');
      return;
    }
    
    setLoading(true);
    setLoginError('');
    
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        // AuthContext içinde hata yönetimi yapıldığı için burada ek işlem yapılmıyor
      }
    } catch (error) {
      setLoginError('Giriş yapılırken bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Kayıt işlemi
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setRegisterError('Lütfen tüm alanları doldurun');
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Şifreler eşleşmiyor');
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    setLoading(true);
    setRegisterError('');
    
    try {
      const result = await register(registerName, registerEmail, registerPassword);
      if (!result.success) {
        // AuthContext içinde hata yönetimi yapıldığı için burada ek işlem yapılmıyor
      }
    } catch (error) {
      setRegisterError('Kayıt işlemi sırasında bir hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  if (user) {
    return <Navigate to="/" />;
  }

  const features = [
    {
      title: "Ters Açık Artırma",
      description: "En düşük teklifi veren kazanır, fiyatlar rekabetçidir."
    },
    {
      title: "Onaylı Firmalar",
      description: "Sadece onaylı ve güvenilir firmalar platformda yer alır."
    },
    {
      title: "Hızlı Süreç",
      description: "6 saat içinde sonuçlanan açık artırma süreci."
    },
    {
      title: "Kolay İletişim",
      description: "Satıcılarla doğrudan WhatsApp üzerinden iletişim."
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: 4, md: 10 }, pb: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          {/* Sol taraf - Giriş formu */}
          <Grid sx={{ width: { xs: '100%', md: '41.67%', lg: '33.33%' } }}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 3, 
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                pb: 3
              }}
            >
              <Box 
                sx={{ 
                  height: 8, 
                  width: '100%', 
                  background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
                  mb: 3
                }} 
              />
              
              <Box sx={{ px: 4 }}>
                <Stack spacing={3} alignItems="center">
                  <Box textAlign="center">
                    <Box sx={{ display: 'inline-flex', mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontSize: 20,
                          fontWeight: 800
                        }}
                      >
                        TA
                      </Box>
                    </Box>
                    
                    <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>
                      Ters Açık Artırma
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Firmalar için hazırlanmış ters açık artırma platformuna hoş geldiniz.
                    </Typography>
                  </Box>
                  
                  {serverError && (
                    <Alert severity="error" sx={{ width: '100%', borderRadius: 2 }}>
                      Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.
                    </Alert>
                  )}
                  
                  <Box sx={{ width: '100%' }}>
                    <Tabs 
                      value={tabValue} 
                      onChange={handleTabChange}
                      variant="fullWidth"
                      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                      <Tab label="Giriş Yap" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
                      <Tab label="Kayıt Ol" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
                    </Tabs>
                    
                    {/* Giriş Formu */}
                    <TabPanel value={tabValue} index={0}>
                      <form onSubmit={handleLogin}>
                        <Stack spacing={3}>
                          {loginError && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                              {loginError}
                            </Alert>
                          )}
                          
                          <TextField
                            fullWidth
                            label="E-mail"
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            autoComplete="email"
                            InputProps={{
                              startAdornment: <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                          />
                          
                          <TextField
                            fullWidth
                            label="Şifre"
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                            InputProps={{
                              startAdornment: <Lock fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                          />
                          
                          <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            endIcon={<ArrowForward />}
                          >
                            Giriş Yap
                          </Button>
                          
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                              Henüz hesabınız yok mu?{' '}
                              <Button
                                color="primary"
                                onClick={() => setTabValue(1)}
                                sx={{ fontWeight: 600, p: 0, minWidth: 'auto' }}
                              >
                                Hemen Kayıt Olun
                              </Button>
                            </Typography>
                          </Box>
                        </Stack>
                      </form>
                    </TabPanel>
                    
                    {/* Kayıt Formu */}
                    <TabPanel value={tabValue} index={1}>
                      <form onSubmit={handleRegister}>
                        <Stack spacing={3}>
                          {registerError && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                              {registerError}
                            </Alert>
                          )}
                          
                          <TextField
                            fullWidth
                            label="Ad Soyad"
                            type="text"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            autoComplete="name"
                            InputProps={{
                              startAdornment: <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                          />
                          
                          <TextField
                            fullWidth
                            label="E-mail"
                            type="email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            autoComplete="email"
                            InputProps={{
                              startAdornment: <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                          />
                          
                          <TextField
                            fullWidth
                            label="Şifre"
                            type="password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            autoComplete="new-password"
                            InputProps={{
                              startAdornment: <Lock fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                            helperText="En az 6 karakter uzunluğunda olmalıdır"
                          />
                          
                          <TextField
                            fullWidth
                            label="Şifre Tekrar"
                            type="password"
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            InputProps={{
                              startAdornment: <Lock fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                          />
                          
                          <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            endIcon={<ArrowForward />}
                          >
                            Kayıt Ol
                          </Button>
                          
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                              Zaten hesabınız var mı?{' '}
                              <Button
                                color="primary"
                                onClick={() => setTabValue(0)}
                                sx={{ fontWeight: 600, p: 0, minWidth: 'auto' }}
                              >
                                Giriş Yapın
                              </Button>
                            </Typography>
                          </Box>
                        </Stack>
                      </form>
                    </TabPanel>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Grid>
          
          {/* Sağ taraf - Özellikler */}
          <Grid sx={{ display: { xs: 'none', md: 'block' }, width: { md: '58.33%', lg: '50%' } }}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: 3, 
                height: '100%',
                position: 'relative',
                overflow: 'hidden', 
                bgcolor: 'primary.dark',
                backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)'
              }}
            >
              <Box sx={{ p: 6, position: 'relative', height: '100%', color: 'white' }}>
                <Box sx={{ maxWidth: 480, mx: 'auto' }}>
                  <Typography variant="h3" fontWeight={700} gutterBottom>
                    Firmanız İçin En Uygun Fiyatları Bulun
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
                    Ters açık artırma platformumuzda, alıcılar ihtiyaçlarını belirtir ve satıcılar rekabetçi teklifler verir. 
                    En düşük teklifi veren kazanır!
                  </Typography>
                  
                  <Stack spacing={4} sx={{ mt: 5 }}>
                    {features.map((feature, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            bgcolor: 'white',
                            color: 'primary.dark',
                            fontSize: 16,
                            fontWeight: 800,
                            mr: 2,
                            flexShrink: 0
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage; 