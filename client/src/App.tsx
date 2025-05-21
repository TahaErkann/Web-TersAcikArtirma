import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Sayfaları yükle
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CategoriesPage from './pages/CategoriesPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ListingsPage from './pages/ListingsPage';
// import MyListingsPage from './pages/MyListingsPage';
// import MyBidsPage from './pages/MyBidsPage';

// Tema oluştur
const theme = createTheme({
  palette: {
    primary: {
      main: '#1A237E', // Koyu lacivert (deep navy blue)
      light: '#534BAE',
      dark: '#0D1259',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4A148C', // Patlıcan moru (aubergine)
      light: '#7C43BD',
      dark: '#2C0B52',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F5F8', // Biraz daha koyu arkaplan
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.0125em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.0125em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        :root {
          --card-shadow: 0px 10px 20px rgba(100, 100, 111, 0.1);
          --transition-speed: 0.3s;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 10%)',
            transform: 'scale(10, 10)',
            opacity: 0,
            transition: 'transform 0.5s, opacity 0.8s',
          },
          '&:active::after': {
            transform: 'scale(0, 0)',
            opacity: 0.3,
            transition: '0s',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #E11D48 0%, #F43F5E 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'var(--card-shadow)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0px 15px 25px rgba(100, 100, 111, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
          },
          '&.Mui-focused': {
            boxShadow: '0px 4px 8px rgba(99, 102, 241, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.2s ease',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          height: 8,
        },
      },
    },
  },
});

// Query Client oluştur
const queryClient = new QueryClient();

// Yetkilendirme gerektiren sayfalar için wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Admin sayfaları için wrapper
const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Onaylı firmalar için wrapper
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ApprovedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user || !user.isApproved) {
    return <Navigate to="/profile" />;
  }

  return <>{children}</>;
};

// App
const AppContent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Router>
      <Navbar user={user} logout={logout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategoriesPage />
            </AdminRoute>
          }
        />
        
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/create-listing" element={<CreateListingPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        {/* <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        
        <Route
          path="/create-listing"
          element={
            <ApprovedRoute>
              <CreateListingPage />
            </ApprovedRoute>
          }
        />
        
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/my-bids"
          element={
            <ProtectedRoute>
              <MyBidsPage />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
