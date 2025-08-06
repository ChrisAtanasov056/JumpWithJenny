import axios from '../api/axius'; 

export const sendContactForm = async (formData) => {
  try {
    const response = await axios.post('/api/Contact/send', formData);
    return response.data;
    
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Failed to send message.');
    } else {
      throw new Error(error.message);
    }
  }
};
