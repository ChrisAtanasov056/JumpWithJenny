import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { create } from '../../services/authService';
import './Register.scss';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import i18n from "../../i18n"; 

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_-]+$/; 

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
  const [retypedPassword, setRetypedPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState(''); 
  const [usernameError, setUsernameError] = useState(''); 

  const inputRefs = {
    firstName: useRef(null),
    lastName: useRef(null),
    userName: useRef(null),
    email: useRef(null),
    password: useRef(null),
    retypedPassword: useRef(null),
  };

  useEffect(() => {
    Object.keys(inputRefs).forEach(key => {
      if (inputRefs[key].current?.value) {
        inputRefs[key].current.closest('.form-field').classList.add('has-content');
      }
    });
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

  const handlePasswordFocus = (e) => {
    handleFocus(e);
    setPasswordFocused(true);
  };
  
  const handlePasswordBlur = (e) => {
    handleBlur(e);
    setPasswordFocused(false);
  };

  const handleEmailBlur = (e) => {
    handleBlur(e);
    if (!isEmailValid(credentials.email)) {
      setEmailError(t('register.invalidEmailError'));
    } else {
      setEmailError('');
    }
  };
  
  const handleUsernameBlur = (e) => {
    handleBlur(e);
    if (!isUsernameValid(credentials.userName)) {
      setUsernameError(t('register.invalidUsernameError'));
    } else {
      setUsernameError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email' && emailError) {
      setEmailError('');
    }
    
    if (name === 'userName' && usernameError) {
      setUsernameError('');
    }
  };

  const handleRetypedPasswordChange = (e) => {
    setRetypedPassword(e.target.value);
  };

  const passwordsMatch = credentials.password === retypedPassword;

  const isEmailValid = (email) => {
    return emailRegex.test(email);
  };
  
  const isUsernameValid = (username) => {
    return username.trim() !== '' && usernameRegex.test(username);
  };

  const handleSubmit = async (e) => {

    const language = i18n.language || 'en'; 

    credentials.language = language;
    
    e.preventDefault();
    
    // Валидация за юзърнейм (само на английски)
    if (!isUsernameValid(credentials.userName)) {
      setUsernameError(t('register.invalidUsernameError'));
      return;
    }
    
    if (!isEmailValid(credentials.email)) {
      setEmailError(t('register.invalidEmailError'));
      return;
    }
    
    if (!passwordsMatch) {
      setErrorMessage(t('register.passwordMismatchError'));
      return;
    }
    
    setErrorMessage('');
    
    try {
      setIsLoading(true);
      const response = await create(credentials);

      if (response?.token && response?.user) {
        authLogin({ ...response.user, token: response.token });
        onRegisterSuccess(t('register.successMessage'));
      } else {
        setErrorMessage(response?.message || t('register.incompleteDataError'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      const apiErrorMessage = error.response?.data?.message;
      if (apiErrorMessage) {
        setErrorMessage(apiErrorMessage); 
      } else {
        setErrorMessage(t('register.credentialsError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordCriteria = [
    { label: t('register.passwordLength'), isValid: credentials.password.length >= 6 },
    { label: t('register.passwordUppercase'), isValid: /[A-Z]/.test(credentials.password) },
    { label: t('register.passwordNumber'), isValid: /[0-9]/.test(credentials.password) },
  ];

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-grid two-columns">
        <div className="form-field">
          <label htmlFor="firstName" className="floating-label">{t('register.firstNameLabel')}</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            ref={inputRefs.firstName}
            value={credentials.firstName}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required
            className="form-input"
          />
          <div className="input-line"></div>
        </div>

        <div className="form-field">
          <label htmlFor="lastName" className="floating-label">{t('register.lastNameLabel')}</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            ref={inputRefs.lastName}
            value={credentials.lastName}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required
            className="form-input"
          />
          <div className="input-line"></div>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field full-width">
          <label htmlFor="userName" className="floating-label">{t('register.userNameLabel')}</label>
          <input
            type="text"
            id="userName"
            name="userName"
            ref={inputRefs.userName}
            value={credentials.userName}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleUsernameBlur}
            required
            className="form-input"
          />
          <div className="input-line"></div>
          {usernameError && (
            <div className="error-message">
              <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" />
              <span className="error-text">{usernameError}</span>
            </div>
          )}
        </div>

        <div className="form-field full-width">
          <label htmlFor="email" className="floating-label">{t('register.emailLabel')}</label>
          <input
            type="email"
            id="email"
            name="email"
            ref={inputRefs.email}
            value={credentials.email}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleEmailBlur}
            required
            className="form-input"
          />
          <div className="input-line"></div>
          {emailError && (
            <div className="error-message">
              <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" />
              <span className="error-text">{emailError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-grid two-columns">
        <div className="form-field">
          <label htmlFor="password" className="floating-label">{t('register.passwordLabel')}</label>
          <input
            type="password"
            id="password"
            name="password"
            ref={inputRefs.password}
            value={credentials.password}
            onChange={handleChange}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            required
            className="form-input"
          />
          <div className="input-line"></div>
          {passwordFocused && (
            <div className="password-criteria">
              <ul>
                {passwordCriteria.map((item, index) => (
                  <li key={index} className={item.isValid ? 'valid' : 'invalid'}>
                    <FontAwesomeIcon icon={item.isValid ? faCheckCircle : faTimesCircle} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="retypedPassword" className="floating-label">{t('register.retypePasswordLabel')}</label>
          <input
            type="password"
            id="retypedPassword"
            value={retypedPassword}
            onChange={handleRetypedPasswordChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={inputRefs.retypedPassword}
            required
            className="form-input"
          />
          <div className="input-line"></div>
          {retypedPassword.length > 0 && (
            <div className={`password-match-icon ${passwordsMatch ? 'valid' : 'invalid'}`}>
              <FontAwesomeIcon icon={passwordsMatch ? faCheckCircle : faTimesCircle} />
            </div>
          )}
        </div>
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
        disabled={isLoading || !passwordsMatch || !isEmailValid(credentials.email) || !!usernameError}
      >
        <span className="button-text">
          {isLoading ? t('register.creatingAccount') : t('register.signUpButton')}
        </span>
        {isLoading && (
          <span className="button-loader"></span>
        )}
      </button>
    </form>
  );
};

export default Register;