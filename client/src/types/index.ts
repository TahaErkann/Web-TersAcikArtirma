// Kullanıcı
export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  companyInfo?: {
    companyName?: string;
    address?: string;
    city?: string;
    phone?: string;
    taxNumber?: string;
    description?: string;
  };
  isAdmin: boolean;
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Kategori
export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Teklif
export interface Bid {
  _id: string;
  bidder: User | string;
  price: number;
  createdAt: string;
}

// İlan
export interface Listing {
  _id: string;
  title: string;
  description: string;
  category: Category | string;
  owner: User | string;
  quantity: number;
  unit: string;
  initialMaxPrice: number;
  currentPrice?: number;
  images: string[];
  bids: Bid[];
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  expiresAt: string;
  isApproved: boolean;
  winner?: User | string;
  createdAt: string;
  updatedAt: string;
}

// API yanıt tipleri
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

// Login/Register sonucu
export interface AuthResult {
  success: boolean;
  error?: unknown;
}

// Auth Context
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Auth State
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// LocalStorage anahtar isimleri
export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'ters_artirma_token',
  USER: 'ters_artirma_user'
}; 