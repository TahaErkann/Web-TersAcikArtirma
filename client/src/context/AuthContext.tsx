import React, { createContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { AuthContextType, AuthState, User, LOCAL_STORAGE_KEYS } from '../types';
import { isTokenValid, getCurrentUser, login as loginService, register as registerService } from '../services/authService';

// Başlangıç durumu
const initialState: AuthState = {
  user: null,
  loading: true,
  error: null
};

// Context oluştur
export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
  token: null
});

// Reducer Aksiyonları
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [token, setToken] = useState<string | null>(localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
      setToken(storedToken);
      
      if (storedToken && isTokenValid(storedToken)) {
        try {
          const user = await getCurrentUser();
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
          setToken(null);
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' });
        }
      } else {
        if (storedToken) {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
          setToken(null);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, []);

  // Giriş yap
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { token: newToken, user } = await loginService({ email, password });
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      
      setToken(newToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { success: true };
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      
      let errorMessage = 'Giriş işlemi sırasında bir hata oluştu.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error };
    } finally {
      if (state.loading) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  // Kayıt ol
  const register = async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { token: newToken, user } = await registerService({ name, email, password });
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      
      setToken(newToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { success: true };
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      
      let errorMessage = 'Kayıt işlemi sırasında bir hata oluştu.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error };
    } finally {
      if (state.loading) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  // Çıkış yap
  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    setToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  // Kullanıcı bilgilerini güncelle
  const updateUser = (user: User) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        token,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 