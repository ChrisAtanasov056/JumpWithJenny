import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext';
import { create } from '../../services/authService';
import './Register.scss';
import { useTranslation } from 'react-i18next';
import { FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import i18n from "../../i18n";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

const Register = ({ onRegisterSuccess }) => {
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
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const isEmailValid = (email) => emailRegex.test(email);
  const isUsernameValid = (username) =>
    username.trim() !== '' && usernameRegex.test(username);

  const handlePasswordFocus = () => {
    setFocusedField('password');
    setPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setFocusedField(null);
    setPasswordFocused(false);
  };

  const handleEmailBlur = () => {
    setFocusedField(null);
    if (credentials.email && !isEmailValid(credentials.email)) {
      setEmailError(t('register.invalidEmailError'));
    } else {
      setEmailError('');
    }
  };

  const handleUsernameBlur = () => {
    setFocusedField(null);
    if (credentials.userName && !isUsernameValid(credentials.userName)) {
      setUsernameError(t('register.invalidUsernameError'));
    } else {
      setUsernameError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

    if (name === 'email' && emailError) {
      setEmailError('');
    }

    if (name === 'userName' && usernameError) {
      setUsernameError('');
    }
  };

  const passwordsMatch = credentials.password === retypedPassword;

  const passwordCriteria = [
    { label: t('register.passwordLength'), isValid: credentials.password.length >= 8 },
    { label: t('register.passwordUppercase'), isValid: /[A-Z]/.test(credentials.password) },
    { label: t('register.passwordLowercase'), isValid: /[a-z]/.test(credentials.password) },
    { label: t('register.passwordNumber'), isValid: /[0-9]/.test(credentials.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const language = i18n.language || 'bg';
    const payload = { ...credentials, language };

    if (!isUsernameValid(credentials.userName)) {
      setUsernameError(t('register.invalidUsernameError'));
      return;
    }

    if (!isEmailValid(credentials.email)) {
      setEmailError(t('register.invalidEmailError'));
      return;
    }

    if (!passwordCriteria.every((item) => item.isValid)) {
      setErrorMessage(t('register.weakPasswordError'));
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage(t('register.passwordMismatchError'));
      return;
    }

    setErrorMessage('');

    try {
      setIsLoading(true);
      const response = await create(payload);

      if (response?.token && response?.user) {
        authLogin({
          ...response.user,
          token: response.token,
          refreshToken: response.refreshToken,
        });
        onRegisterSuccess?.(t('register.successMessage'));
      } else {
        setErrorMessage(response?.message || t('register.incompleteDataError'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      const apiErrors = error.response?.data?.errors;
      const apiErrorMessage =
        Array.isArray(apiErrors) && apiErrors.length > 0
          ? apiErrors.join(' ')
          : error.response?.data?.message;
      if (apiErrorMessage) {
        setErrorMessage(apiErrorMessage);
      } else {
        setErrorMessage(t('register.credentialsError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (name, value) =>
    `form-field ${focusedField === name ? 'is-focused' : ''} ${value ? 'has-content' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-grid two-columns">
        <div className={fieldClass('firstName', credentials.firstName)}>
          <label htmlFor="register-firstName" className="floating-label">
            {t('register.firstNameLabel')}
          </label>
          <input
            type="text"
            id="register-firstName"
            name="firstName"
            autoComplete="given-name"
            value={credentials.firstName}
            onChange={handleChange}
            onFocus={() => setFocusedField('firstName')}
            onBlur={() => setFocusedField(null)}
            required
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
        </div>

        <div className={fieldClass('lastName', credentials.lastName)}>
          <label htmlFor="register-lastName" className="floating-label">
            {t('register.lastNameLabel')}
          </label>
          <input
            type="text"
            id="register-lastName"
            name="lastName"
            autoComplete="family-name"
            value={credentials.lastName}
            onChange={handleChange}
            onFocus={() => setFocusedField('lastName')}
            onBlur={() => setFocusedField(null)}
            required
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
        </div>
      </div>

      <div className="form-grid">
        <div className={`${fieldClass('userName', credentials.userName)} full-width`}>
          <label htmlFor="register-userName" className="floating-label">
            {t('register.userNameLabel')}
          </label>
          <input
            type="text"
            id="register-userName"
            name="userName"
            autoComplete="username"
            autocapitalize="none"
            autoCorrect="off"
            value={credentials.userName}
            onChange={handleChange}
            onFocus={() => setFocusedField('userName')}
            onBlur={handleUsernameBlur}
            required
            aria-invalid={Boolean(usernameError)}
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
          {usernameError && (
            <div className="error-message" role="alert">
              <FaExclamationCircle className="error-icon" aria-hidden="true" />
              <span className="error-text">{usernameError}</span>
            </div>
          )}
        </div>

        <div className={`${fieldClass('email', credentials.email)} full-width`}>
          <label htmlFor="register-email" className="floating-label">
            {t('register.emailLabel')}
          </label>
          <input
            type="email"
            id="register-email"
            name="email"
            autoComplete="email"
            value={credentials.email}
            onChange={handleChange}
            onFocus={() => setFocusedField('email')}
            onBlur={handleEmailBlur}
            required
            aria-invalid={Boolean(emailError)}
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
          {emailError && (
            <div className="error-message" role="alert">
              <FaExclamationCircle className="error-icon" aria-hidden="true" />
              <span className="error-text">{emailError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-grid two-columns">
        <div className={fieldClass('password', credentials.password)}>
          <label htmlFor="register-password" className="floating-label">
            {t('register.passwordLabel')}
          </label>
          <input
            type="password"
            id="register-password"
            name="password"
            autoComplete="new-password"
            value={credentials.password}
            onChange={handleChange}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            required
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
          {passwordFocused && (
            <div className="password-criteria">
              <ul>
                {passwordCriteria.map((item, index) => (
                  <li key={index} className={item.isValid ? 'valid' : 'invalid'}>
                    {item.isValid ? (
                      <FaCheckCircle aria-hidden="true" />
                    ) : (
                      <FaTimesCircle aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={fieldClass('retypedPassword', retypedPassword)}>
          <label htmlFor="register-retypedPassword" className="floating-label">
            {t('register.retypePasswordLabel')}
          </label>
          <input
            type="password"
            id="register-retypedPassword"
            autoComplete="new-password"
            value={retypedPassword}
            onChange={(e) => setRetypedPassword(e.target.value)}
            onFocus={() => setFocusedField('retypedPassword')}
            onBlur={() => setFocusedField(null)}
            required
            className="form-input"
          />
          <div className="input-line" aria-hidden="true"></div>
          {retypedPassword.length > 0 && (
            <div
              className={`password-match-icon ${passwordsMatch ? 'valid' : 'invalid'}`}
              aria-hidden="true"
            >
              {passwordsMatch ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="error-message" role="alert">
          <FaExclamationCircle className="error-icon" aria-hidden="true" />
          <span className="error-text">{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className={`submit-button ${isLoading ? 'is-loading' : ''}`}
        disabled={
          isLoading || !passwordsMatch || !isEmailValid(credentials.email) || Boolean(usernameError)
        }
      >
        <span className="button-text">
          {isLoading ? t('register.creatingAccount') : t('register.signUpButton')}
        </span>
        {isLoading && <span className="button-loader" aria-hidden="true"></span>}
      </button>
    </form>
  );
};

export default Register;
