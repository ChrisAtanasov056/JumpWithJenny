// src/components/ForgotPassword/ResetPassword.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ResetPassword.scss';
import { forgotPassword } from '../../services/authService';
import SuccessModal from '../Register/SuccessModal';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [feedback, setFeedback] = useState({ message: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', isError: false });

    if (
      passwords.newPassword.length < 8 ||
      !/[A-Z]/.test(passwords.newPassword) ||
      !/[a-z]/.test(passwords.newPassword) ||
      !/[0-9]/.test(passwords.newPassword)
    ) {
      setFeedback({
        message: t('resetPassword.weakPassword'),
        isError: true,
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setFeedback({
        message: t('resetPassword.passwordsMismatch'),
        isError: true,
      });
      return;
    }

    if (!token || !email) {
      setFeedback({
        message: t('resetPassword.invalidLink'),
        isError: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await forgotPassword({
        token,
        email,
        newPassword: passwords.newPassword,
      });

      setShowSuccess(true);
      timerRef.current = setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('resetPassword.genericError');
      setFeedback({
        message: errorMessage,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  if (!token || !email) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form-box">
          <p className="feedback-message error" role="alert">
            {t('resetPassword.invalidLink')}
          </p>
          <button type="button" onClick={() => navigate('/')} className="back-button">
            {t('resetPassword.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form-box">
        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>{t('resetPassword.title')}</h2>

            <div className="form-group">
              <label htmlFor="newPassword">{t('resetPassword.newPasswordLabel')}</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('resetPassword.confirmPasswordLabel')}</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {feedback.message && (
              <p
                className={`feedback-message ${feedback.isError ? 'error' : 'success'}`}
                role={feedback.isError ? 'alert' : 'status'}
              >
                {feedback.message}
              </p>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('resetPassword.resetting') : t('resetPassword.resetPassword')}
            </button>
          </form>
        ) : (
          <SuccessModal
            message={t('resetPassword.successMessage')}
            onClose={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
