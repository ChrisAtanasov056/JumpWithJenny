import axios from '../api/axius';


// Register a new user
export const create = async (userData) => {
  console.log("Create: ", userData);
  try {
    const response = await axios.post('/Account/signup', userData);
    console.log("Response: ", response);
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
  try {
    const response = await axios.post('/Account/login', {
      Email: userData.email, 
      Password: userData.password,
    });
    return response.data; 
  } catch (error) {
    console.error('Login error:', error);
    throw error; 
  }
};

// Verify Email after user clicks on the link
export const verifyEmail = async (userId, token) => {
  try {
    console.log(userId)
    const response = await axios.get(`/Account/confirmemail?userId=${userId}&token=${token}`);
    console.log(response);
    
    if (response.status == 200){
      const statusResponse = await axios.get(`/verifyEmailStatus?userId=${userId}`);
      return statusResponse.data.user;
    }
  } catch (error) {
    console.error('Error during email verification:', error);
    throw error;
  }
};

// Change Password
export const changePassword = async (userData) => {
  try {
    const response = await axios.put('/User/change-password', {
      id: userData.id,
      currentPassword: userData.currentPassword,
      newPassword: userData.newPassword,
    });
    return response.data;  // return the response directly
  } catch (error) {
    console.error('Change password error:', error);
    throw error;  // Throw the error to propagate it to the component
  }
};

export const forgotPassword = async (userData) => {
  try {
    const response = await axios.post('/Account/reset-password', {
      token: userData.token,
      email: userData.email,
      newPassword: userData.newPassword,
    });
    console.log(response)
    return response.data; 
  } catch (error) {
    console.error('Change password error:', error);
    throw error;  // Throw the error to propagate it to the component
  }
};

export const resendVerificationEmail = async (email) => {
  try {
    const response = await axios.post('/Account/resend-verification', {
      Email: email,
    });
    console.log(response)
    return response.data; 
  } catch (error) {
    console.error(error);
    throw error;  
  }
};
