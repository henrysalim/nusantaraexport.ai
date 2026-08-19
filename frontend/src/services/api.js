import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor: Attach JWT Bearer token ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ne_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: Handle 401 and token refresh ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints to avoid infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/register') &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('ne_refresh_token');
        if (!refreshToken) {
          isRefreshing = false;
          return Promise.reject(error);
        }
        const res = await api.post('/api/auth/refresh', {
          refresh_token: refreshToken,
        });

        const newToken = res.data.access_token;
        localStorage.setItem('ne_access_token', newToken);
        localStorage.setItem('ne_refresh_token', res.data.refresh_token);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens on refresh failure
        localStorage.removeItem('ne_access_token');
        localStorage.removeItem('ne_refresh_token');
        localStorage.removeItem('ne_user');
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Health Check ---
export const checkHealth = () => api.get('/health');

// --- AI Chatbot (RAG + All Modules) ---
export const sendChatMessage = (message, contextData = {}) =>
  api.post('/api/chatbot/send', { message, context_data: contextData });

// --- Export Readiness Simulator ---
export const simulateReadiness = (data) =>
  api.post('/api/simulator/readiness', data);

// --- Post-Export Problem Solver ---
export const solvePostExport = (data) =>
  api.post('/api/simulator/post-export-solve', data);

// --- Dry Run Simulator ---
export const simulateDryRun = (data) =>
  api.post('/api/simulator/dry-run', data);

// --- Nego Coach ---
export const analyzeNegotiation = (data) =>
  api.post('/api/simulator/nego-coach', data);

// --- Smart Export Calendar ---
export const getSmartCalendar = (data) =>
  api.post('/api/simulator/smart-calendar', data);

// --- Market Gap Analysis ---
export const analyzeMarketGap = (data) =>
  api.post('/api/market/gap-analysis', data);

// --- Packaging Compliance ---
export const checkPackaging = (data) =>
  api.post('/api/compliance/packaging-check', data);

// --- HS Code Optimizer ---
export const classifyHSCode = (data) =>
  api.post('/api/compliance/hs-code', data);

// --- RAG Query ---
export const queryRAG = (query) =>
  api.post('/api/rag/query', { query, user_id: 'demo_user' });

// --- ASR (Voice → Text) ---
export const transcribeAudio = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  return api.post('/asr/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- TTS (Text → Voice) ---
export const synthesizeSpeech = (text) =>
  api.post('/tts/synthesize', { text }, { responseType: 'blob' });

// --- Marketplace Products ---
export const getMarketplaceProducts = (params = {}) =>
  api.get('/api/marketplace/products', { params });

export const createMarketplaceProduct = (data) =>
  api.post('/api/marketplace/products', data);

export const getMarketplaceProductDetail = (id) =>
  api.get(`/api/marketplace/products/${id}`);

export const getMarketplaceBuyers = (params = {}) =>
  api.get('/api/marketplace/buyers', { params });

export const cooperativeMatch = (data) =>
  api.post('/api/marketplace/cooperative-match', data);

// --- User Profile ---
export const getMyProfile = () =>
  api.get('/api/auth/me');

export const updateMyProfile = (data) =>
  api.put('/api/auth/profile', data);

export default api;
