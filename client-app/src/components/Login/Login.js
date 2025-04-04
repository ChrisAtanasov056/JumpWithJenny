import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext'; // Make sure the useAuth hook is properly imported
import { login } from '../../services/authService'; // Ensure login function is correct
import './Login.scss';

const Login = ({ onClose, onLoginSuccess }) => {
  const { login: authLogin } = useAuth(); // Destructure login from the context
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials); // Assuming login is the correct service function
      if (response) {
        const { token, user } = response;
        if (user?.id && user?.username && user?.firstname && user?.lastname && user?.email && token) {
          // Save token and user in localStorage
          localStorage.setItem('jwtToken', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Update context with user data and token
          authLogin({ ...user, token });

          // Handle successful login and close modal
          onLoginSuccess({ ...user, token });
          onClose();
          setSuccessMessage('Login successful. Welcome back!');
        } else {
          setErrorMessage('Login failed. Incomplete user data received.');
        }
      } else {
        setErrorMessage('Login failed. No user data received.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Welcome Back</h2>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      <button type="submit" className="sign-in-button">Login</button>
    </form>
  );
};

export default Login;
