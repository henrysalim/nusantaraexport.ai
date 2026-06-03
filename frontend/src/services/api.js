import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
