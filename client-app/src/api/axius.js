import axios from 'axios';

// Use Vite's environment variables (import.meta.env)
const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !rawApiBaseUrl) {
  console.error('VITE_API_URL is not configured for production; falling back to https://api.jumpwithjenny.com');
}

export const API_BASE_URL = (
  rawApiBaseUrl ||
  (import.meta.env.PROD ? 'https://api.jumpwithjenny.com' : 'https://localhost:7024')
).replace(/\/+$/, '');
export const AUTH_LOGOUT_EVENT = 'auth:logout';

const AUTH_BYPASS_PATHS = [
  '/Account/login',
  '/Account/signup',
  '/Account/refresh-token',
  '/Account/logout',
  '/api/Auth/google-login',
  '/api/Auth/facebook-login',
];

const shouldBypassRefresh = (url = '') => {
  const normalizedUrl = String(url).toLowerCase();
  return AUTH_BYPASS_PATHS.some((path) => normalizedUrl.includes(path.toLowerCase()));
};

export const clearStoredAuth = () => {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

export const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token) => resolve({ accessToken: token }),
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const refreshResponse = await axios.post(
      `${API_BASE_URL}/Account/refresh-token`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { accessToken, refreshToken: newRefreshToken, user } = refreshResponse.data || {};
    if (!accessToken) {
      throw new Error('No access token returned');
    }

    localStorage.setItem('jwtToken', accessToken);
    if (newRefreshToken && newRefreshToken !== refreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    if (user) {
      try {
        const existingUserRaw = localStorage.getItem('user');
        const existingUser = existingUserRaw ? JSON.parse(existingUserRaw) : {};
        localStorage.setItem('user', JSON.stringify({ ...existingUser, ...user, token: accessToken, refreshToken: newRefreshToken || refreshToken }));
      } catch {
        localStorage.setItem('user', JSON.stringify({ ...user, token: accessToken, refreshToken: newRefreshToken || refreshToken }));
      }
    }

    processQueue(null, accessToken);

    return {
      accessToken,
      refreshToken: newRefreshToken || refreshToken,
      user,
    };
  } catch (refreshError) {
    processQueue(refreshError, null);
    clearStoredAuth();
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

// Request Interceptor - Add Bearer Token and handle FormData headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token?.trim()) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Single-flight token refresh with queue for concurrent 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldBypassRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        const latestToken = localStorage.getItem('jwtToken');
        const sentAuth = originalRequest.headers?.Authorization || '';
        if (latestToken && sentAuth && sentAuth !== `Bearer ${latestToken}`) {
          originalRequest.headers.Authorization = `Bearer ${latestToken}`;
          return api(originalRequest);
        }
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      const { accessToken } = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;