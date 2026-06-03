// Konfigurasi API URL — otomatis menyesuaikan antara local dev dan production
// Server backend berjalan di port 8081
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'
