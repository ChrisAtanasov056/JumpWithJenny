// src/components/Login/Login.jsx

import React, { useState, useRef, useEffect } from 'react';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (emailRef.current?.value) {
      emailRef.current.closest('.form-field').classList.add('has-content');
    }
    if (passwordRef.current?.value) {
      passwordRef.current.closest('.form-field').classList.add('has-content');
    }
  }, []);

  const handleFocus = (e) => {
    const container = e.target.closest('.form-field');
    container.classList.add('is-focused');
  };

  const handleBlur = (e) => {
    const container = e.target.closest('.form-field');
    container.classList.remove('is-focused');
    if (e.target.value) {
      container.classList.add('has-content');
    } else {
      container.classList.remove('has-content');
    }
  };

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
        if (user?.id && user?.username && user?.firstname && 
            user?.lastname && user?.email && user?.role && 
            token && refreshToken) {
          authLogin({ ...user, token, refreshToken });
          onLoginSuccess({ ...user, token, refreshToken });
          onClose();
        } else {
          setErrorMessage(t('login.incompleteDataError'));
        }
      } else {
        setErrorMessage(response?.Message || t('login.credentialsError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.response?.data?.message || t('login.credentialsError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-field">
        <label htmlFor="email" className="floating-label">
          {t('login.emailLabel')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          ref={emailRef}
          value={credentials.email}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required
          className="form-input"
        />
        <div className="input-line"></div>
      </div>

      <div className="form-field">
        <label htmlFor="password" className="floating-label">
          {t('login.passwordLabel')}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          ref={passwordRef}
          value={credentials.password}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required
          className="form-input"
        />
        <div className="input-line"></div>
      </div>

      {errorMessage && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" />
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
        {isLoading && (
          <span className="button-loader"></span>
        )}
      </button>
    </form>
  );
};

export default Login;