import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { create } from '../../services/authService';
import SuccessModal from './SuccessModal';
import './Register.scss';

const Register = ({ onClose, onLoginSuccess }) => {
  const { login: authLogin } = useAuth();
  const [credentials, setCredentials] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // State to control modal visibility

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsRegistering(true);
      const response = await create(credentials);

      if (response) {
        const { token, user } = response;
        if (user?.id && user?.username && user?.firstname && user?.lastname && user?.email && token) {
          localStorage.setItem('jwtToken', token);
          localStorage.setItem('user', JSON.stringify(user));
          authLogin({ ...user, token });

          // Set success message and show modal
          setSuccessMessage('Registration successful. A verification email has been sent.');
          setShowModal(true); // Show the modal
        } else {
          setErrorMessage('Registration failed. Incomplete user data received.');
        }
      } else {
        setErrorMessage('Registration failed. No user data received.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Registration failed. Please check your details and try again.');
      setIsRegistering(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false); // Close the modal
  };

  return (
    <div className="register-container">
      {!isRegistering && !showModal && (
        <form onSubmit={handleSubmit} className="register-form">
          <h2>Create Account</h2>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="userName"
              value={credentials.userName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={credentials.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={credentials.lastName}
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
          <button type="submit" className="sign-up-button">Sign Up</button>
        </form>
      )}

      {/* Display the success modal when showModal is true */}
      {showModal && <SuccessModal message={successMessage} onClose={handleModalClose} />}
    </div>
  );
};

export default Register;