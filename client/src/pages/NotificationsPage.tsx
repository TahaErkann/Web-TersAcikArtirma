import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Paper, 
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { useNotification } from '../hooks/useNotification';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../services/notificationService';

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, loadNotifications } = useNotification();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    document.title = 'Bildirimler | Ters Açık Artırma';
    loadNotifications();
  }, [loadNotifications]);
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.relatedListing) {
      const listingId = typeof notification.relatedListing === 'object' 
        ? (notification.relatedListing as any)._id || (notification.relatedListing as any).id 
        : notification.relatedListing;
      
      if (listingId) {
        navigate(`/listings/${listingId}`);
      } else {
        console.error('Geçerli ilan ID bulunamadı');
      }
    }
  };
  
  // Bildirim tipine göre icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return '💰';
      case 'expiry':
        return '⏱️';
      case 'approval':
        return '✅';
      case 'rejection':
        return '❌';
      case 'winner':
        return '🏆';
      default:
        return '📌';
    }
  };
  
  // Bildirim tipine göre renk
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bid':
        return '#1976d2';
      case 'expiry':
        return '#ed6c02';
      case 'approval':
        return '#2e7d32';
      case 'rejection':
        return '#d32f2f';
      case 'winner':
        return '#2e7d32';
      default:
        return '#1976d2';
    }
  };
  
  const loadMore = () => {
    // setPage ve diğer yükleme mantığı
    setPage(prev => prev + 1);
  };
  
  if (loading && page === 1) {
    return (
      <Container sx={{ my: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bildirimler
        </Typography>
        
        {unreadCount > 0 && (
          <Tooltip title="Tümünü okundu işaretle">
            <Button
              startIcon={<MarkEmailReadIcon />}
              variant="outlined"
              onClick={() => markAllAsRead()}
            >
              Tümünü Okundu İşaretle
            </Button>
          </Tooltip>
        )}
      </Box>
      
      <Paper elevation={2}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Bildiriminiz bulunmuyor
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ width: '100%' }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ fontSize: '1.5rem' }}>{getTypeIcon(notification.type)}</Box>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle1" 
                          component="div" 
                          sx={{ 
                            fontWeight: notification.isRead ? 'normal' : 'bold',
                            color: getTypeColor(notification.type)
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ 
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                            {' • '}
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                          </Typography>
                        </>
                      }
                    />
                    
                    {!notification.isRead && (
                      <ListItemSecondaryAction>
                        <Tooltip title="Okundu olarak işaretle">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                          >
                            <MarkEmailReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  
                  {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            
            {hasMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Daha Fazla Yükle'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage; 