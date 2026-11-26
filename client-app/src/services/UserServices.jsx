import api from '../api/axius';

const UserService = {
  getAllUsers: async () => {
    const response = await api.get('/User/all');
    return response.data;
  },

  getUsersPaged: async ({ page = 1, pageSize = 25, search } = {}) => {
    const params = {
      page,
      pageSize,
      ...(search ? { search } : {}),
    };
    const response = await api.get('/User/all', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/User/${userId}`);
    return response.data;
  },

  createUserAdmin: async (userData) => {
    const response = await api.post('/api/Admin/users/create', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/User/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/User/${userId}`);
    return response.data;
  },
};

export default UserService;
