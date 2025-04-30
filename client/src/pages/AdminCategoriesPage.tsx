import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Category } from '../types';

const AdminCategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Yükleme işlemi
  useEffect(() => {
    loadCategories();
  }, []);

  // Arama filtresi
  useEffect(() => {
    if (categories.length) {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [categories, searchQuery]);

  // Kategorileri getir
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
      setFilteredCategories(data);
      setError(null);
    } catch (err) {
      setError('Kategoriler yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Kategori ekleme modalını aç
  const handleOpenAddModal = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCurrentCategory(null);
    setModalMode('add');
    setOpenModal(true);
  };

  // Kategori düzenleme modalını aç
  const handleOpenEditModal = (category: Category) => {
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCurrentCategory(category);
    setModalMode('edit');
    setOpenModal(true);
  };

  // Modalı kapat
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Kategori kaydet (ekle/düzenle)
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setError('Kategori adı boş olamaz.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await createCategory({
          name: categoryName.trim(),
          description: categoryDescription.trim() || undefined,
          isActive: true
        });
        setSuccess('Kategori başarıyla eklendi.');
      } else if (modalMode === 'edit' && currentCategory) {
        await updateCategory(currentCategory._id, {
          name: categoryName.trim(),
          description: categoryDescription.trim() || undefined
        });
        setSuccess('Kategori başarıyla güncellendi.');
      }

      handleCloseModal();
      loadCategories();
    } catch (err) {
      setError('Kategori kaydedilirken bir hata oluştu.');
      console.error(err);
    }
  };

  // Kategori silme dialogunu aç
  const handleOpenDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Kategori silme dialogunu kapat
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Kategori sil
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete._id);
      setSuccess('Kategori başarıyla silindi.');
      loadCategories();
    } catch (err) {
      setError('Kategori silinirken bir hata oluştu.');
      console.error(err);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Bildirimleri kapat
  const handleCloseAlert = () => {
    setSuccess(null);
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
            <CancelIcon color="error" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h5" color="error" gutterBottom>
            Erişim Reddedildi
          </Typography>
          <Typography variant="body1">
            Bu sayfayı görüntülemek için admin yetkilerine sahip olmanız gerekmektedir.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Kategori Yönetimi
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{
              borderRadius: 2,
              boxShadow: 2
            }}
          >
            Yeni Kategori
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kategori Adı</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Oluşturulma</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'Arama kriterlerine uygun kategori bulunamadı.' : 'Henüz kategori bulunmamaktadır.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{category.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                          {category.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {category.isActive ? (
                          <Chip
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="Aktif"
                            variant="outlined"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon fontSize="small" />}
                            label="Pasif"
                            variant="outlined"
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.createdAt 
                            ? new Date(category.createdAt).toLocaleDateString('tr-TR')
                            : '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleOpenEditModal(category)}
                          size="small"
                          sx={{
                            color: 'primary.main',
                            mr: 1,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleOpenDeleteDialog(category)}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Kategori Ekle/Düzenle Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {modalMode === 'add' ? 'Yeni Kategori Ekle' : 'Kategori Düzenle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kategori Adı"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            variant="outlined"
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Açıklama"
            fullWidth
            value={categoryDescription}
            onChange={(e) => setCategoryDescription(e.target.value)}
            variant="outlined"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" variant="outlined">
            İptal
          </Button>
          <Button onClick={handleSaveCategory} variant="contained" color="primary">
            {modalMode === 'add' ? 'Ekle' : 'Güncelle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Kategori Sil</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            "{categoryToDelete?.name}" kategorisini silmek istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Bu işlem geri alınamaz ve bu kategoriye bağlı ilanlar etkilenebilir.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit" variant="outlined">
            İptal
          </Button>
          <Button onClick={handleDeleteCategory} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirimler */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success" variant="filled" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error" variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminCategoriesPage; 