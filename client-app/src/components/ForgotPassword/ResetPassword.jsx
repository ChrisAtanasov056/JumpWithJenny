// src/components/ResetPassword/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import i18n from '../../i18n';
import './ResetPassword.scss';
import { forgotPassword } from '../../services/authService';
import PropTypes from 'prop-types';
import SuccessModal from '../Register/SuccessModal';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [feedback, setFeedback] = useState({ message: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', isError: false });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setFeedback({ 
        message: i18n.t('resetPassword.passwordsMismatch'), 
        isError: true 
      });
      return;
    }

    if (!token || !email) {
      setFeedback({ 
        message: i18n.t('resetPassword.invalidLink'), 
        isError: true 
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await forgotPassword({ 
        token,
        email,
        newPassword: passwords.newPassword
      });
      
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || i18n.t('resetPassword.genericError');
      setFeedback({ 
        message: errorMessage, 
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  if (!token || !email) {
    return (
      <div className="reset-password-container">
        <p className="feedback-message error">{i18n.t('resetPassword.invalidLink')}</p>
        <button onClick={() => navigate('/')} className="back-button">
          {i18n.t('resetPassword.goHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-box">
        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>{i18n.t('resetPassword.title')}</h2>
            
            <div className="form-group">
              <label htmlFor="newPassword">{i18n.t('resetPassword.newPasswordLabel')}</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{i18n.t('resetPassword.confirmPasswordLabel')}</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {feedback.message && (
              <p className={`feedback-message ${feedback.isError ? 'error' : 'success'}`}>
                {feedback.message}
              </p>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? i18n.t('resetPassword.resetting') : i18n.t('resetPassword.resetPassword')}
            </button>
          </form>
        ) : (
          <SuccessModal 
            message={i18n.t('resetPassword.successMessage')}
            onClose={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;