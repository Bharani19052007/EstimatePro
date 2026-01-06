import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    let errorMessage = 'An error occurred';
    
    if (response) {
      errorMessage = response.data?.message || response.statusText;
      
      // Handle specific status codes
      if (response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Show error toast
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return Promise.reject(error);
  }
);

// API methods
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
};

export const trips = {
  create: (tripData) => api.post('/trips', tripData),
  getAll: () => api.get('/trips'),
  getById: (id) => api.get(`/trips/${id}`),
  update: (id, tripData) => api.put(`/trips/${id}`, tripData),
  delete: (id) => api.delete(`/trips/${id}`),
};

export const users = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
};

export default api;
