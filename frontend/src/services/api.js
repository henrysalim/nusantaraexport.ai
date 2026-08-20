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

// ─── Session Helpers ──────────────────────────────────────────────

/**
 * Decode JWT payload WITHOUT verifying signature (client-side only).
 * Used to proactively check token expiry before making a request.
 */
function _decodeJWTPayload(token) {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is missing, malformed, or expires within
 * `bufferSeconds` seconds (default 60 s — refresh before actual expiry).
 */
function _isTokenExpiredOrSoon(token, bufferSeconds = 60) {
  if (!token) return true;
  const payload = _decodeJWTPayload(token);
  if (!payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp - nowSec < bufferSeconds;
}

/** Emit a custom event so AuthContext / UI can react to session expiry. */
function _dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent('ne:session-expired'));
}

// ─── Token refresh state ──────────────────────────────────────────
let _proactiveRefreshPromise = null;

async function _proactiveRefresh() {
  if (_proactiveRefreshPromise) return _proactiveRefreshPromise;
  _proactiveRefreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('ne_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refresh_token: refreshToken },
        { withCredentials: true }
      );
      const { access_token, refresh_token } = res.data;
      localStorage.setItem('ne_access_token', access_token);
      if (refresh_token) localStorage.setItem('ne_refresh_token', refresh_token);
      return access_token;
    } catch {
      // Refresh token also expired — clear session
      localStorage.removeItem('ne_access_token');
      localStorage.removeItem('ne_refresh_token');
      localStorage.removeItem('ne_user');
      _dispatchSessionExpired();
      throw new Error('Session expired');
    } finally {
      _proactiveRefreshPromise = null;
    }
  })();
  return _proactiveRefreshPromise;
}

// --- Request Interceptor: Proactive token expiry check ---
api.interceptors.request.use(
  async (config) => {
    // Skip auth endpoints to avoid loops
    const isAuthEndpoint = [
      '/api/auth/login', '/api/auth/register',
      '/api/auth/refresh', '/api/auth/logout',
    ].some(path => config.url?.includes(path));

    if (!isAuthEndpoint) {
      const token = localStorage.getItem('ne_access_token');

      // Proactively refresh if token expires within 60 seconds
      if (token && _isTokenExpiredOrSoon(token, 60)) {
        try {
          const newToken = await _proactiveRefresh();
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        } catch {
          // _proactiveRefresh already cleared tokens & dispatched event
          return config;
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        // Notify app via event (AuthContext listens) instead of hard redirect
        _dispatchSessionExpired();
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

// --- Document Generator (Draft + PDF) ---
export const saveDocDraft = (body, docId = null) => {
  const params = docId ? `?doc_id=${docId}` : '';
  return api.post(`/api/docs/draft/save${params}`, body);
};

export const getDocDrafts = () =>
  api.get('/api/docs/draft/list');

export const getDocDraft = (docId) =>
  api.get(`/api/docs/draft/${docId}`);

export const deleteDocDraft = (docId) =>
  api.delete(`/api/docs/draft/${docId}`);

export const generateDocPDF = (docType, docId) =>
  api.post(`/api/docs/generate/${docType}?doc_id=${docId}`, {}, { responseType: 'blob' });

export default api;
