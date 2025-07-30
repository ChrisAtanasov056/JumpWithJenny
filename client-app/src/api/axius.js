import axios from 'axios';

// Use Vite's environment variables (import.meta.env)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7024';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token?.trim()) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/Account/refresh-token`, 
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        localStorage.setItem('jwtToken', accessToken);
        if (newRefreshToken && newRefreshToken !== refreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;