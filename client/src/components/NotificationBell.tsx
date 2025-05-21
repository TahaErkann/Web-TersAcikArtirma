import React, { useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Tooltip, Divider, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { useNotification } from '../hooks/useNotification';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notificationId: string, listingId?: string | any) => {
    markAsRead(notificationId);
    handleClose();
    
    // Eğer ilgili ilan varsa, ilana yönlendir
    if (listingId) {
      // İlan ID'sini doğru şekilde al, obje değil string olmalı
      const formattedListingId = typeof listingId === 'object' 
        ? listingId._id || listingId.id 
        : listingId;
      
      if (formattedListingId) {
        navigate(`/listings/${formattedListingId}`);
      }
    }
  };
  
  const handleMarkAllAsRead = (event: React.MouseEvent) => {
    event.stopPropagation();
    markAllAsRead();
  };
  
  // Bildirim tipine göre renk
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bid':
        return 'primary.main';
      case 'expiry':
        return 'warning.main';
      case 'approval':
        return 'success.main';
      case 'rejection':
        return 'error.main';
      case 'winner':
        return 'success.main';
      default:
        return 'text.primary';
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
  
  return (
    <>
      <Tooltip title="Bildirimler">
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={handleClick}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Bildirimler
          </Typography>
          {unreadCount > 0 && (
            <Tooltip title="Tümünü okundu işaretle">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <MarkEmailReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Bildiriminiz bulunmuyor
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification._id}
              onClick={() => handleNotificationClick(notification._id, notification.relatedListing)}
              sx={{ 
                px: 2, 
                py: 1,
                backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                display: 'block',
                whiteSpace: 'normal'
              }}
            >
              <Box sx={{ display: 'flex', mb: 0.5 }}>
                <Box sx={{ mr: 1 }}>{getTypeIcon(notification.type)}</Box>
                <Typography variant="subtitle2" color={getTypeColor(notification.type)} fontWeight={notification.isRead ? 'normal' : 'bold'}>
                  {notification.title}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ opacity: notification.isRead ? 0.8 : 1 }}>
                {notification.message}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
              </Typography>
            </MenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Button 
              size="small" 
              onClick={() => navigate('/notifications')}
              sx={{ fontSize: '0.75rem' }}
            >
              Tüm Bildirimleri Gör
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 