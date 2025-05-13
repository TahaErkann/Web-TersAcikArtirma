// Kullanıcı
export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin?: boolean;
  isApproved?: boolean;
  name?: string;
  phone?: string;
  address?: string;
  companyInfo?: {
    companyName?: string;
    address?: string;
    city?: string;
    phone?: string;
    taxNumber?: string;
    description?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Kategori
export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Teklif
export interface Bid {
  user: User | string;
  bidder?: User | string;
  amount: number;
  price?: number;
  timestamp: string;
  _id?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  isApproved?: boolean;
}

// İlan
export interface Listing {
  _id?: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  endDate: string;
  status: 'active' | 'ended' | 'cancelled';
  seller: User | string;
  bids: Bid[];
  images: string[];
  category: string | Category;
  location: string;
  createdAt?: string;
  updatedAt?: string;
  quantity?: number;
  unit?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    description?: string;
  }>;
  expiresAt?: string;
  owner?: User | string;
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
  token?: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (username: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Auth State
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Socket Context
export interface SocketContextType {
  socket: any;
  connected: boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, data: any) => void;
}

// LocalStorage anahtar isimleri
export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'ters_acik_artirma_token',
  USER: 'ters_acik_artirma_user'
}; 