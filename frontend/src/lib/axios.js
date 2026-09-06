import axios from 'axios';

// The backend runs on port 8000 (standard for FastAPI, as per previous days)
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', // Use env variable with localhost fallback
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
