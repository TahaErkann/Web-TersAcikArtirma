// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Grid,
  useTheme,
  alpha,
  Divider,
  Stack
} from '@mui/material';
import { 
  Business, 
  CheckCircle, 
  Cancel, 
  Info, 
  Phone, 
  Email, 
  LocationOn, 
  Badge,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers, approveUser, rejectUser } from '../services/authService';
import { User } from '../types';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError('Kullanıcılar yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Filter users based on approval status
  const pendingUsers = users.filter(u => !u.isAdmin && !u.isApproved && !u.isRejected);
  const approvedUsers = users.filter(u => !u.isAdmin && u.isApproved);
  const rejectedUsers = users.filter(u => !u.isAdmin && u.isRejected);
  
  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewUserDialog(true);
  };
  
  // Approval dialog
  const handleOpenApproveDialog = (user) => {
    setSelectedUser(user);
    setApproveDialog(true);
  };
  
  // Reject dialog
  const handleOpenRejectDialog = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setRejectDialog(true);
  };
  
  // Close all dialogs
  const handleCloseDialogs = () => {
    setViewUserDialog(false);
    setApproveDialog(false);
    setRejectDialog(false);
    setSelectedUser(null);
    setRejectionReason('');
  };
  
  // Approve user
  const handleApproveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await approveUser(selectedUser._id);
      setSuccessMessage(`${selectedUser.companyInfo?.companyName || selectedUser.name} başarıyla onaylandı.`);
      fetchUsers();
    } catch (err) {
      setError('Firma onaylanırken bir hata oluştu.');
      console.error(err);
    } finally {
      handleCloseDialogs();
    }
  };
  
  // Reject user
  const handleRejectUser = async () => {
    if (!selectedUser) return;
    
    try {
      await rejectUser(selectedUser._id, rejectionReason || 'Admin tarafından reddedildi');
      setSuccessMessage(`${selectedUser.companyInfo?.companyName || selectedUser.name} reddedildi.`);
      fetchUsers();
    } catch (err) {
      setError('Firma reddedilirken bir hata oluştu.');
      console.error(err);
    } finally {
      handleCloseDialogs();
    }
  };
  
  // Close alerts
  const handleCloseAlert = () => {
    setSuccessMessage(null);
    setError(null);
  };
  
  if (!user?.isAdmin) {
    return (
      <Container sx={{ my: 4 }}>
        <Paper
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Cancel color="error" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h5" color="error" gutterBottom>
            Yetkisiz Erişim
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece admin kullanıcılar yönetim paneline erişebilir.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Box sx={{ py: { xs: 4, md: 6 }, backgroundColor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Yönetim Paneli
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Firmalar için onay yönetimi ve platforma kayıtlı tüm kullanıcıların listesi.
          </Typography>
        </Box>
        
        {/* Dashboard summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.main',
                    mr: 2
                  }}
                >
                  <Info />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Onay Bekleyen
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {pendingUsers.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    mr: 2
                  }}
                >
                  <CheckCircle />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Onaylı Firma
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {approvedUsers.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.main',
                    mr: 2
                  }}
                >
                  <Cancel />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reddedilen
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {rejectedUsers.length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="user tabs"
              sx={{ px: 3, pt: 2 }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
                    <Box>Onay Bekleyenler {pendingUsers.length > 0 && 
                      <Chip 
                        size="small" 
                        label={pendingUsers.length} 
                        sx={{ ml: 1, height: 20, minWidth: 20 }} 
                      />
                    }</Box>
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
                    <Box>Onaylı Firmalar</Box>
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Cancel sx={{ mr: 1, color: 'error.main' }} fontSize="small" />
                    <Box>Reddedilenler</Box>
                  </Box>
                }
              />
            </Tabs>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Onay Bekleyen Firmalar */}
              <TabPanel value={tabValue} index={0}>
                {pendingUsers.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Info sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                      Onay bekleyen firma bulunmamaktadır
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Firma Bilgileri</TableCell>
                          <TableCell>İletişim</TableCell>
                          <TableCell>Kayıt Tarihi</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={user.profilePicture} 
                                  sx={{ mr: 2, bgcolor: 'primary.main' }}
                                >
                                  {user.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" noWrap>
                                    {user.companyInfo?.companyName || 'Belirtilmemiş'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" noWrap>
                                  {user.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Detayları Görüntüle">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleViewUser(user)}
                                    sx={{ 
                                      color: 'info.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Onayla">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleOpenApproveDialog(user)}
                                    sx={{ 
                                      color: 'success.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reddet">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleOpenRejectDialog(user)}
                                    sx={{ 
                                      color: 'error.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
              
              {/* Onaylı Firmalar */}
              <TabPanel value={tabValue} index={1}>
                {approvedUsers.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                      Onaylı firma bulunmamaktadır
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Firma Bilgileri</TableCell>
                          <TableCell>İletişim</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {approvedUsers.map((user) => (
                          <TableRow key={user._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={user.profilePicture} 
                                  sx={{ mr: 2, bgcolor: 'primary.main' }}
                                >
                                  {user.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" noWrap>
                                    {user.companyInfo?.companyName || 'Belirtilmemiş'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" noWrap>
                                  {user.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={<CheckCircle fontSize="small" />} 
                                label="Onaylı" 
                                color="success" 
                                variant="outlined" 
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Detayları Görüntüle">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleViewUser(user)}
                                    sx={{ 
                                      color: 'info.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reddet">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleOpenRejectDialog(user)}
                                    sx={{ 
                                      color: 'error.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
              
              {/* Reddedilen Firmalar */}
              <TabPanel value={tabValue} index={2}>
                {rejectedUsers.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Cancel sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                      Reddedilen firma bulunmamaktadır
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Firma Bilgileri</TableCell>
                          <TableCell>Red Sebebi</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rejectedUsers.map((user) => (
                          <TableRow key={user._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  src={user.profilePicture} 
                                  sx={{ mr: 2, bgcolor: 'primary.main' }}
                                >
                                  {user.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" noWrap>
                                    {user.companyInfo?.companyName || 'Belirtilmemiş'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {user.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {user.rejectionReason || 'Belirtilmemiş'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={<Cancel fontSize="small" />} 
                                label="Reddedildi" 
                                color="error" 
                                variant="outlined" 
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Detayları Görüntüle">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleViewUser(user)}
                                    sx={{ 
                                      color: 'info.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Onayla">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleOpenApproveDialog(user)}
                                    sx={{ 
                                      color: 'success.main',
                                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </>
          )}
        </Paper>
      </Container>
      
      {/* User details dialog */}
      <Dialog
        open={viewUserDialog}
        onClose={handleCloseDialogs}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              Firma Detayları
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={selectedUser.profilePicture} 
                      sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}
                    >
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedUser.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {selectedUser.isApproved ? (
                          <Chip 
                            icon={<CheckCircle fontSize="small" />} 
                            label="Onaylı Firma" 
                            color="success" 
                            variant="outlined" 
                            size="small" 
                          />
                        ) : selectedUser.isRejected ? (
                          <Chip 
                            icon={<Cancel fontSize="small" />} 
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
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Firma Bilgileri
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Firma Adı
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.companyInfo?.companyName || 'Belirtilmemiş'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Badge sx={{ color: 'secondary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Vergi Numarası
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.companyInfo?.taxNumber || 'Belirtilmemiş'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ color: 'info.main', mr: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Adres
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.companyInfo?.address || 'Belirtilmemiş'}, {selectedUser.companyInfo?.city || ''}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ color: 'success.main', mr: 2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Telefon
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.companyInfo?.phone || 'Belirtilmemiş'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {selectedUser.companyInfo?.description && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Firma Açıklaması
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                        {selectedUser.companyInfo?.description}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedUser.isRejected && selectedUser.rejectionReason && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="error" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">
                          Red Sebebi:
                        </Typography>
                        <Typography variant="body2">
                          {selectedUser.rejectionReason}
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialogs} color="inherit">
                Kapat
              </Button>
              {!selectedUser.isApproved && (
                <Button 
                  onClick={() => {
                    handleCloseDialogs();
                    handleOpenApproveDialog(selectedUser);
                  }} 
                  color="success"
                  variant="contained"
                >
                  Onayla
                </Button>
              )}
              {!selectedUser.isRejected && (
                <Button 
                  onClick={() => {
                    handleCloseDialogs();
                    handleOpenRejectDialog(selectedUser);
                  }} 
                  color="error"
                  variant="contained"
                >
                  Reddet
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Approve dialog */}
      <Dialog
        open={approveDialog}
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Firmayı Onayla</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography gutterBottom>
              <strong>{selectedUser?.companyInfo?.companyName || selectedUser?.name}</strong> firmasını onaylamak istediğinizden emin misiniz?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Onaylandıktan sonra firma ilan oluşturabilir ve tekliflerde bulunabilir.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">İptal</Button>
          <Button 
            onClick={handleApproveUser} 
            variant="contained" 
            color="success"
            autoFocus
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject dialog */}
      <Dialog
        open={rejectDialog}
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Firmayı Reddet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography gutterBottom>
              <strong>{selectedUser?.companyInfo?.companyName || selectedUser?.name}</strong> firmasını reddetmek istediğinizden emin misiniz?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Reddedilen firmalar ilan oluşturamaz ve tekliflerde bulunamaz.
            </Typography>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Red Sebebi"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Firmaya bildirilecek ret nedeni"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">İptal</Button>
          <Button 
            onClick={handleRejectUser} 
            variant="contained" 
            color="error"
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar alerts */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage; 