import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { login } from '../../services/authService';
import './Login.css';

const Login = ({ onClose, onLoginSuccess }) => {
  const { login: authLogin } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials);
      if (response) {
        const { token, user } = response;
        const { User: id, name, email } = user; // Extract userId, name, and email
        if (id && name && email && token) {
          localStorage.setItem('jwtToken', token);
          localStorage.setItem('user', JSON.stringify({ id, name, email }));
          authLogin({ id, name, email, token });
          onLoginSuccess({ id, name, email, token });
          onClose();
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
    <form onSubmit={handleSubmit}>
      <h2>Welcome Back</h2>
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
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
      <button type="submit" className="sign-in-button">Sign In</button>
    </form>
  );
};

export default Login;
