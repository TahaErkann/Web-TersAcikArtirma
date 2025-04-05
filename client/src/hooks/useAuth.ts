import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '../types';

// Authentication context'e kolay erişim için hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth hook, AuthProvider içinde kullanılmalıdır');
  }
  
  return context;
}; 