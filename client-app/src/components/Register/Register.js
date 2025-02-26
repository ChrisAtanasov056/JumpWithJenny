import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { create } from '../../services/authService';
import { login } from '../../services/authService'; // Assuming login function exists
import './Register.css';

const Register = ({ onClose, onLoginSuccess }) => {
  const { login: authLogin } = useAuth();
  const [credentials, setCredentials] = useState({ userName: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await create(credentials); // Register the user
      if (response) {
        const { token, user } = response; // Extract user and token from the response
        if (user?.id && user?.name && user?.email && token) {
          localStorage.setItem('jwtToken', token); // Store the token
          localStorage.setItem('user', JSON.stringify(user)); // Store the user info
          authLogin({ ...user, token }); // Update auth context with user data and token

          // Automatically log in after successful registration
          const loginResponse = await login({ email: credentials.email, password: credentials.password });
          if (loginResponse) {
            const { token, user } = loginResponse;
            localStorage.setItem('jwtToken', token); // Store token
            localStorage.setItem('user', JSON.stringify(user)); // Store user info
            authLogin({ ...user, token }); // Update auth context with user and token
            onLoginSuccess({ ...user, token }); // Notify parent component of successful login
            onClose(); // Close the registration modal
          } else {
            setErrorMessage('Login failed after registration.');
          }
        } else {
          setErrorMessage('Registration failed. Incomplete user data received.');
        }
      } else {
        setErrorMessage('Registration failed. No user data received.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Registration failed. Please check your details and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Create Account</h2>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          name="userName"
          value={credentials.userName}
          onChange={handleChange}
          required
        />
      </div>
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
      <button type="submit" className="button register-btn">Sign Up</button>
    </form>
  );
};

export default Register;