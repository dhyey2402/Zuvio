import axios from 'axios';

// Ensure we fallback to the correct production API if env var is missing
let API_URL = import.meta.env.VITE_API_URL || 'https://zuvio.onrender.com/api/v1';

// Safeguard against misconfigured Vercel environment variables that miss the /api/v1 suffix
if (API_URL.replace(/\/$/, '') === 'https://zuvio.onrender.com') {
  API_URL = 'https://zuvio.onrender.com/api/v1';
} else if (API_URL.replace(/\/$/, '') === 'http://localhost:8000') {
  API_URL = 'http://localhost:8000/api/v1';
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic error handling for 401s
    if (error.response?.status === 401) {
      // Potentially trigger a logout or redirect if needed
      // window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);
