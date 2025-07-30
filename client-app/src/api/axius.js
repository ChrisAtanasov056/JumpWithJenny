import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7024';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor -> добавя Bearer Token ако е наличен
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

// Response Interceptor -> автоматично рефрешва токена при 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        // Рефреш заявка
        const refreshResponse = await axios.post(`${API_BASE_URL}/Account/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // Запазваме новите токени
        localStorage.setItem('jwtToken', accessToken);
        if (newRefreshToken && newRefreshToken !== refreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Обновяваме Authorization header за оригиналната заявка
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        return api(originalRequest); // Повторно изпълняваме оригиналната заявка
      } catch (refreshError) {
        // Ако рефрешът се провали - триеш всичко и редиректваш към login
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
