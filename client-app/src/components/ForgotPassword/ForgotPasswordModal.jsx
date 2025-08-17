// ForgotPasswordModal.jsx
import React, { useState } from 'react';
import './ForgotPasswordModal.scss';
import { forgotPasswordEmail } from '../../services/authService'; 
import i18n from '../../i18n'; 
import PropTypes from 'prop-types';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ message: '', isError: false });

    try {
      await forgotPasswordEmail({ email, language: i18n.language });
      setFeedback({ 
        message: i18n.t('auth.forgotPasswordSuccessMessage'), 
        isError: false 
      });

      setTimeout(() => {
        onClose();
      }, 2500);
      
    } catch (err) {
      const errorMessage = err.message || i18n.t('auth.forgotPasswordGenericError');
      setFeedback({ 
        message: errorMessage, 
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <div className="form-container">
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <h2>{i18n.t('auth.forgotPasswordTitle')}</h2>
            <p>{i18n.t('auth.forgotPasswordInstructions')}</p>
            <div className="form-group">
              <label htmlFor="email">{i18n.t('auth.emailLabel')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={i18n.t('auth.emailPlaceholder')}
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? i18n.t('auth.sending') : i18n.t('auth.sendResetLink')}
            </button>
            {feedback.message && (
              <p className={`feedback-message ${feedback.isError ? 'error' : 'success'}`}>
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