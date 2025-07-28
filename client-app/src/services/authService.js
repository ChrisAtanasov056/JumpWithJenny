import axios from '../api/axius';


// Register a new user
export const create = async (userData) => {
  console.log("Create: ", userData);
  try {
    const response = await axios.post('/Account/signup', userData);
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

// Change Password
export const changePassword = async (userData) => {
  try {
    console.log("ChangePassword params:", userData);
    const response = await axios.post('/Account/reset-password', {
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

export const verifyEmail = async (userId, token, language) => {
  try {
    console.log("VerifyEmail params:", userId, token, language);
    const response = await axios.post('/Account/confirmemail', {
      userId,
      token,
      language,  
    }); 
    console.log("VerifyEmail response:", response);

    if (response.status === 200) {
      const statusResponse = await axios.get(`/verifyEmailStatus?userId=${userId}`);
      return statusResponse.data.user;
    }
  } catch (error) {
    console.error('Error during email verification:', error);
    throw error;
  }
};

// Reset/Forgot Password with language parameter
export const forgotPassword = async ({ email, token, newPassword }) => {
  try {
    const response = await axios.post('/Account/reset-password', {
      email: email.trim(),
      token: token.trim(),
      newPassword: newPassword.trim()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Reset password error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors || ['Password reset failed']
    });

    throw {
      success: false,
      status: error.response?.status,
      errors: error.response?.data?.errors || [error.message]
    };
  }
};



export const resendVerificationEmail = async (email, language) => {
  try {
    const response = await axios.post('/Account/resend-verification', {
      Email: email,
      language, 
    });
    console.log('Resend verification response:', response);
    return response.data;
  } catch (error) {
    console.error('Resend verification email error:', error);
    throw error;
  }
};
