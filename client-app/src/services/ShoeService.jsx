import axios from '../api/axius';

const ShoeService = {
  getAllShoes: async () => {
    const response = await axios.get('/api/shoes');
    if (!response || !response.data) {
      throw new Error('Failed to fetch shoes');
    }
    return response.data;
  },

  getInventory: async () => {
    const response = await axios.get('/api/shoes/inventory');
    return response.data;
  },

  getShoeById: async (id) => {
    const response = await axios.get(`/api/shoes/${id}`);
    return response.data;
  },

  addShoe: async (shoeData) => {
    const response = await axios.post('/api/shoes', shoeData);
    return response.data;
  },

  addShoesBatch: async (size, count) => {
    const response = await axios.post('/api/shoes/batch', {
      Size: Number(size),
      Count: Number(count),
    });
    return response.data;
  },

  updateShoe: async (id, shoeData) => {
    const response = await axios.put(`/api/shoes/${id}`, shoeData);
    return response.data;
  },

  deleteShoe: async (id) => {
    const response = await axios.delete(`/api/shoes/${id}`);
    return response.data;
  },

  deleteOneBySize: async (size) => {
    const response = await axios.delete(`/api/shoes/by-size/${Number(size)}`);
    return response.data;
  },
};

export default ShoeService;
