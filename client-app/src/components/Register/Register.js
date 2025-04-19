import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { create } from '../../services/authService';
import SuccessModal from './SuccessModal';
import './Register.scss';
import { useTranslation } from 'react-i18next';

const Register = ({ onClose, onLoginSuccess, onRegisterSuccess }) => {
  const { t } = useTranslation();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsRegistering(true);
      const response = await create(credentials);

      if (response?.token && response?.user) {
        localStorage.setItem('jwtToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        authLogin({ ...response.user, token: response.token });
        onRegisterSuccess(t('register.successMessage'));
      } else {
        setErrorMessage(t('register.incompleteDataError'));
      }
    } catch (error) {
      setErrorMessage(t('register.credentialsError'));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>{t('register.createAccount')}</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>{t('register.firstNameLabel')}</label>
            <input
              type="text"
              name="firstName"
              value={credentials.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('register.lastNameLabel')}</label>
            <input
              type="text"
              name="lastName"
              value={credentials.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>{t('register.userNameLabel')}</label>
            <input
              type="text"
              name="userName"
              value={credentials.userName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>{t('register.emailLabel')}</label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>{t('register.passwordLabel')}</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <button 
          type="submit" 
          className="sign-up-button"
          disabled={isRegistering}
        >
          {isRegistering ? t('register.creatingAccount') : t('register.signUpButton')}
        </button>
      </form>
    </div>
  );
};

export default Register;