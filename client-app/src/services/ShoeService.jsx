// src/services/ShoeService.js
import axios from '../api/axius';

const ShoeService = {
  getAllShoes: async () => {
    const response = await axios.get("/api/shoes");
    console.log("Response from getAllShoes:", response);
    if (!response || !response.data) {
      throw new Error("Failed to fetch shoes");
    }
    return response.data;
  },

  getShoeById: async (id) => {
    const response = await axios.get(`/api/shoes/${id}`);
    console.log("Response from getShoeById:", response);
    return response.data;
  },

  addShoe: async (shoeData) => {
    const response = await axios.post("/api/shoes", shoeData);
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
};

export default ShoeService;