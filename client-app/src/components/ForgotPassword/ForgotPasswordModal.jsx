// ForgotPasswordModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import './ForgotPasswordModal.scss';
import { forgotPasswordEmail } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';

const ForgotPasswordModal = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  const modalRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useOutsideClick(modalRef, onClose, true);
  useModalAccessibility({ isOpen: true, onClose, modalRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ message: '', isError: false });

    try {
      await forgotPasswordEmail({ email, language: i18n.language });
      setFeedback({
        message: t('auth.forgotPasswordSuccessMessage'),
        isError: false,
      });

      timerRef.current = setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      const errorMessage = err.message || t('auth.forgotPasswordGenericError');
      setFeedback({
        message: errorMessage,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-modal-overlay">
      <div
        ref={modalRef}
        className="forgot-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label={t('close')}
        >
          &times;
        </button>
        <div className="form-container">
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <h2 id="forgot-password-title">{t('auth.forgotPasswordTitle')}</h2>
            <p>{t('auth.forgotPasswordInstructions')}</p>
            <div className="form-group">
              <label htmlFor="forgot-password-email">{t('auth.emailLabel')}</label>
              <input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
            {feedback.message && (
              <p
                className={`feedback-message ${feedback.isError ? 'error' : 'success'}`}
                role={feedback.isError ? 'alert' : 'status'}
              >
                {feedback.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

ForgotPasswordModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ForgotPasswordModal;
