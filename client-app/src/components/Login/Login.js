import React, { useState } from 'react';
import { useAuth } from '../../services/AuthContext'; 
import { login } from '../../services/authService'; 
import './Login.scss';
import { useTranslation } from 'react-i18next'; // Add i18n hook

const Login = ({ onClose, onLoginSuccess }) => {
  const { t } = useTranslation(); // Use translation hook
  const { login: authLogin } = useAuth();
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
        console.log(user)
        if (user?.id && user?.username && user?.firstname && user?.lastname && user?.email && user?.role && token) {
          // Save token and user in localStorage
          localStorage.setItem('jwtToken', token);
          localStorage.setItem('user', JSON.stringify(user).toLocaleLowerCase); 
          // Update context with user data and token
          authLogin({ ...user, token });

          // Handle successful login and close modal
          onLoginSuccess({ ...user, token });
          onClose();
          setSuccessMessage(t('login.successMessage'));
        } else {
          setErrorMessage(t('login.incompleteDataError'));
        }
      } else {
        setErrorMessage(t('login.noDataError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(t('login.credentialsError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>{t('login.welcomeBack')}</h2>
      <div className="form-group">
        <label>{t('login.emailLabel')}</label>
        <input
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>{t('login.passwordLabel')}</label>
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
      <button type="submit" className="sign-in-button">{t('login.loginButton')}</button>
    </form>
  );
};

export default Login;