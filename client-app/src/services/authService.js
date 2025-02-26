//authService.js 
import axios from '../api/axius';

// Register a new user
export const create = async (userData) => {
  
  try {
    const response = await axios.post('/Account/signup', userData)
    console.log("Create: ", response.data.user)
    return response.data; // Adjust according to your API response structure
  } catch (error) {
    if (error.response) {
      console.error('🚨 Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    } else {
      console.error('Unexpected error:', error.message);
    }
    throw error;
  }
};

// Login an existing user
export const login = async (userData) => {
  console.log("login ", userData)
    try {
      const response = await axios.post('/Account/login', {
        Email: userData.email, // Use Email instead of Username
        Password: userData.password,
      });
      return response.data; // Adjust this depending on what you want to return
    } catch (error) {
      console.error('Login error:', error);
      throw error; // This allows you to catch it in your component
    }
  };

export const changePassword = async (userData) => {
  console.log('Payload:', {
    id: userData.id,
    currentPassword: userData.currentPassword,
    newPassword: userData.newPassword,
  });
  try {
    const response = await axios.put('/User/change-password', {
      id: userData.id,
      currentPassword: userData.currentPassword,
      newPassword: userData.newPassword, // Ensure the frontend sends this value
    });
    console.log('Response: ', response);
    return response.data; // Depending on your API, adjust this as needed
  } catch (error) {
    console.error('Change password error:', error);
    throw error; // This will propagate the error to your component
  }
};