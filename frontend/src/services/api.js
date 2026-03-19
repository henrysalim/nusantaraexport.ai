import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Health Check ---
export const checkHealth = () => api.get('/health');

// --- ASR (Voice → Text) ---
export const transcribeAudio = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  return api.post('/asr/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- Market Gap Analysis ---
export const analyzeMarketGap = (query) =>
  api.post('/market-gap/analyze', { query });

// --- TTS (Text → Voice) ---
export const synthesizeSpeech = (text) =>
  api.post('/tts/synthesize', { text }, { responseType: 'blob' });

export default api;
