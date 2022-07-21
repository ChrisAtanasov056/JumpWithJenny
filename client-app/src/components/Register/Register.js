import React, { useState } from 'react';
import { create } from '../../services/authService';
import './Register.css';

const Register = ({ onClose, setModalOpen, onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await create(credentials);
      if (response) {
        onLoginSuccess(response); // Pass response to parent on successful registration
        setModalOpen(true); // Switch to login form after registration
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } catch (error) {
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
          name="name"
          value={credentials.name}
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
