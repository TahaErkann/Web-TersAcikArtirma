// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useScrollTrigger,
  Slide,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Logout, 
  Dashboard, 
  ShoppingCart, 
  Home, 
  Category,
  Notifications,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// TODO: Bu interface'i types klasörüne taşı
interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  isAdmin: boolean;
  isApproved: boolean;
}

interface NavbarProps {
  user: User | null;
  logout: () => void;
}

// Navbar görünürlüğünü kontrol eden bileşen
function HideOnScroll(props: { children: React.ReactElement }) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar: React.FC<NavbarProps> = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Seçili menü item'ını belirle
  const isActive = (path: string) => location.pathname === path;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/');
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }

    setDrawerOpen(open);
  };

  const menuItems = [
    {
      text: 'Ana Sayfa',
      icon: <Home />,
      link: '/'
    },
    {
      text: 'Kategoriler',
      icon: <Category />,
      link: '/categories'
    },
    {
      text: 'İlanlar',
      icon: <ShoppingCart />,
      link: '/listings'
    }
  ];

  return (
    <HideOnScroll>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: 'text.primary'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1 }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 3,
                display: 'flex',
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: '.1rem',
                textDecoration: 'none',
                alignItems: 'center'
              }}
            >
              <Box 
                component="span"
                sx={{ 
                  background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)', 
                  color: 'white',
                  p: 0.8,
                  px: 1.5,
                  mr: 1,
                  borderRadius: 1,
                  fontSize: '1.3rem'
                }}
              >
                TA
              </Box>
              TERS ARTIRMA
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.link}
                  startIcon={item.icon}
                  sx={{ 
                    my: 2, 
                    mx: 0.5,
                    color: isActive(item.link) ? 'primary.main' : 'text.secondary',
                    fontWeight: isActive(item.link) ? 700 : 500,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.03)',
                    },
                    '&::after': isActive(item.link) ? {
                      content: '""',
                      position: 'absolute',
                      width: '50%',
                      height: '3px',
                      borderRadius: '3px',
                      bottom: '6px',
                      backgroundColor: 'primary.main'
                    } : {}
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            {user ? (
              <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Bildirimler">
                  <IconButton sx={{ mr: 1 }}>
                    <Badge badgeContent={3} color="primary">
                      <Notifications fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Tema değiştir">
                  <IconButton sx={{ mr: 1 }}>
                    <LightMode fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Box 
                  onClick={handleMenu} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    py: 0.5,
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.03)',
                    }
                  }}
                >
                  {user.profilePicture ? (
                    <Avatar 
                      alt={user.name} 
                      src={user.profilePicture} 
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.main' 
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  )}
                  <Typography 
                    sx={{ 
                      fontSize: '0.875rem',
                      ml: 1,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {user.name.split(' ')[0]}
                  </Typography>
                </Box>
                
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  sx={{
                    mt: 1,
                    '& .MuiPaper-root': {
                      borderRadius: 2,
                      minWidth: 180,
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleClose} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    Profilim
                  </MenuItem>
                  <MenuItem component={Link} to="/my-listings" onClick={handleClose} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <ShoppingCart fontSize="small" sx={{ color: 'info.main' }} />
                    </ListItemIcon>
                    İlanlarım
                  </MenuItem>
                  <MenuItem component={Link} to="/my-bids" onClick={handleClose} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <ShoppingCart fontSize="small" sx={{ color: 'secondary.main' }} />
                    </ListItemIcon>
                    Tekliflerim
                  </MenuItem>
                  {user.isAdmin && (
                    <MenuItem component={Link} to="/admin" onClick={handleClose} sx={{ py: 1.5 }}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" sx={{ color: 'warning.main' }} />
                      </ListItemIcon>
                      Yönetim Paneli
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <Logout fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    Çıkış Yap
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button 
                color="primary" 
                component={Link} 
                to="/login"
                variant="contained"
                startIcon={<AccountCircle />}
                sx={{ 
                  px: 3,
                  py: 1,
                  borderRadius: 6,
                  boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)'
                }}
              >
                Giriş Yap
              </Button>
            )}
          </Toolbar>
        </Container>

        {/* Mobil Menü */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 270,
              boxSizing: 'border-box',
              borderRight: 'none',
              boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              onClick={toggleDrawer(false)}
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: '.1rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box 
                component="span"
                sx={{ 
                  background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)', 
                  color: 'white',
                  p: 0.8,
                  px: 1.5,
                  mr: 1,
                  borderRadius: 1,
                  fontSize: '1.2rem'
                }}
              >
                TA
              </Box>
              TERS ARTIRMA
            </Typography>
          </Box>
          <Divider />
          <Box
            sx={{ width: '100%' }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
          >
            <List sx={{ pt: 1 }}>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    component={Link} 
                    to={item.link}
                    sx={{ 
                      py: 1.5,
                      pl: 3,
                      bgcolor: isActive(item.link) ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      borderRight: isActive(item.link) ? '3px solid #4F46E5' : 'none'
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive(item.link) ? 'primary.main' : 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: isActive(item.link) ? 600 : 400,
                        color: isActive(item.link) ? 'primary.main' : 'inherit'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider />
            {user && (
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/profile" sx={{ py: 1.5, pl: 3 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AccountCircle />
                    </ListItemIcon>
                    <ListItemText primary="Profilim" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/my-listings" sx={{ py: 1.5, pl: 3 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ShoppingCart />
                    </ListItemIcon>
                    <ListItemText primary="İlanlarım" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/my-bids" sx={{ py: 1.5, pl: 3 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ShoppingCart />
                    </ListItemIcon>
                    <ListItemText primary="Tekliflerim" />
                  </ListItemButton>
                </ListItem>
                {user.isAdmin && (
                  <ListItem disablePadding>
                    <ListItemButton component={Link} to="/admin" sx={{ py: 1.5, pl: 3 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Dashboard />
                      </ListItemIcon>
                      <ListItemText primary="Yönetim Paneli" />
                    </ListItemButton>
                  </ListItem>
                )}
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout} sx={{ py: 1.5, pl: 3 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Çıkış Yap" />
                  </ListItemButton>
                </ListItem>
              </List>
            )}
          </Box>
        </Drawer>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar; 