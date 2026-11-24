import axios from '../api/axius';

// Register a new user
export const create = async (userData) => {
  try {
    const response = await axios.post('/Account/signup', userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Unexpected error:', error.message);
    }
    throw error;
  }
};

export const login = async (userData) => {
  try {
    const response = await axios.post('/Account/login', {
      Email: userData.email,
      Password: userData.password,
    });
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = async (refreshToken) => {
  await axios.post('/Account/logout', { refreshToken });
};

// Change Password
export const changePassword = async (userData) => {
  try {
    const response = await axios.post('/Account/reset-password', {
      id: userData.id,
      currentPassword: userData.currentPassword,
      newPassword: userData.newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

export const forgotPasswordEmail = async (userData) => {
  try {
    const response = await axios.post('/Account/forgot-password', {
      email: userData.email,
      language: userData.language,
    });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// Verify Email
export const verifyEmail = async (userId, token, language) => {
  try {
    const response = await axios.post('/Account/confirmemail', {
      userId,
      token,
      language,
    });
    return response.data.user;
  } catch (error) {
    console.error('Error during email verification:', error);
    throw error;
  }
};

// Reset/Forgot Password
export const forgotPassword = async ({ email, token, newPassword }) => {
  try {
    const response = await axios.post('/Account/reset-password-token', {
      email: email,
      token: token,
      newPassword: newPassword
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

// Resend Verification Email
export const resendVerificationEmail = async (email, language) => {
  try {
    const response = await axios.post('/Account/resend-verification', {
      Email: email,
      language,
    });
    return response.data;
  } catch (error) {
    console.error('Resend verification email error:', error);
    throw error;
  }
};

// Google Login
export const googleLogin = async (googleToken) => {
  try {
    const response = await axios.post('api/Auth/google-login', {
      code: googleToken,
    });

    if (response.data.Success) {
      if (response.data.Token) {
        localStorage.setItem('jwtToken', response.data.Token);
      }
      if (response.data.RefreshToken) {
        localStorage.setItem('refreshToken', response.data.RefreshToken);
      }
      return response.data;
    } else {
      throw new Error(response.data?.Errors?.[0] || 'Google login failed');
    }
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

export const facebookLogin = async (accessToken) => {
  try {
    const response = await axios.post('api/Auth/facebook-login', {
      accessToken: accessToken,
    });

    if (response.data.Success) {
      if (response.data.Token) {
        localStorage.setItem('jwtToken', response.data.Token);
      }
      if (response.data.RefreshToken) {
        localStorage.setItem('refreshToken', response.data.RefreshToken);
      }
      return response.data;
    } else {
      throw new Error(response.data?.Errors?.[0] || 'Facebook login failed');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    throw error;
  }
};