// src/components/Login/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { login } from '../../services/authService';
import './Login.scss';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const Login = ({ onClose, onLoginSuccess }) => {
  const { t } = useTranslation();
  const { login: authLogin } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await login(credentials);
      if (response) {
        const { token, refreshToken, user } = response;
        if (user?.id && user?.email && token && refreshToken) {
          authLogin({ ...user, token, refreshToken });
          onLoginSuccess?.({ ...user, token, refreshToken });
          onClose?.();
        } else {
          setErrorMessage(t('login.incompleteDataError'));
        }
      } else {
        setErrorMessage(response?.Message || t('login.credentialsError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.some((msg) => String(msg).toLowerCase().includes('locked'))) {
        setErrorMessage(t('login.accountLocked'));
      } else {
        setErrorMessage(error.response?.data?.message || t('login.credentialsError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div
        className={`form-field ${focusedField === 'email' ? 'is-focused' : ''} ${
          credentials.email ? 'has-content' : ''
        }`}
      >
        <label htmlFor="login-email" className="floating-label">
          {t('login.emailLabel')}
        </label>
        <input
          type="email"
          id="login-email"
          name="email"
          autoComplete="email"
          value={credentials.email}
          onChange={handleChange}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          required
          className="form-input"
        />
        <div className="input-line" aria-hidden="true"></div>
      </div>

      <div
        className={`form-field ${focusedField === 'password' ? 'is-focused' : ''} ${
          credentials.password ? 'has-content' : ''
        }`}
      >
        <label htmlFor="login-password" className="floating-label">
          {t('login.passwordLabel')}
        </label>
        <input
          type="password"
          id="login-password"
          name="password"
          autoComplete="current-password"
          value={credentials.password}
          onChange={handleChange}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          required
          className="form-input"
        />
        <div className="input-line" aria-hidden="true"></div>
      </div>

      {errorMessage && (
        <div className="error-message" role="alert">
          <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" aria-hidden="true" />
          <span className="error-text">{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className={`submit-button ${isLoading ? 'is-loading' : ''}`}
        disabled={isLoading}
      >
        <span className="button-text">
          {isLoading ? t('login.loading') : t('login.loginButton')}
        </span>
        {isLoading && <span className="button-loader" aria-hidden="true"></span>}
      </button>
    </form>
  );
};

export default Login;
