import axios from 'axios';

// TODO: Update this with your backend URL
// For local development: http://localhost:8000
// For production: your deployed backend URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

console.log('API_BASE_URL configured as:', API_BASE_URL);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Request error - no response:', error.message, 'URL:', error.config?.url);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    CREATE_OR_UPDATE_STUDENT: '/api/auth/student',
    GET_STUDENT: (firebaseUid) => `/api/auth/student/${firebaseUid}`,
    UPDATE_ONBOARDING: (firebaseUid) => `/api/auth/student/${firebaseUid}/onboarding`,
  },
  // Transaction endpoints
  TRANSACTIONS: {
    CREATE: '/api/transactions',
    GET_ALL: (firebaseUid) => `/api/transactions/${firebaseUid}`,
    GET_ONE: (transactionId) => `/api/transactions/single/${transactionId}`,
    UPDATE: (transactionId) => `/api/transactions/${transactionId}`,
    DELETE: (transactionId) => `/api/transactions/${transactionId}`,
    STATS: (firebaseUid) => `/api/transactions/stats/${firebaseUid}`,
    MONTHLY: (firebaseUid) => `/api/transactions/monthly/${firebaseUid}`,
    IMPORT_BILLS: '/api/transactions/import-bills',
  },
};

export default api;
