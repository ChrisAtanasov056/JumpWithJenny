import React, { useState } from 'react';
import './AuthModal.scss';
import Login from '../Login/Login';
import Register from '../Register/Register';
import SuccessModal from '../Register/SuccessModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { signInWithFacebook, signInWithGoogle } from '../../services/firebase'; 
import ForgotPasswordModal from '../ForgotPassword/ForgotPasswordModal';
import axios from '../../api/axius';
import { useTranslation } from 'react-i18next';

const AuthModal = ({ onClose, onLoginSuccess, setModalOpen }) => {
  const { t, i18n } = useTranslation(); 
  const [isLogin, setIsLogin] = useState(true);
  const [animationClass, setAnimationClass] = useState('zoom-in');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const socialPlatforms = [
    { platform: 'Facebook', icon: faFacebook, className: 'fb-btn' },
    { platform: 'Google', icon: faGoogle, className: 'google-btn' },
    { platform: 'Instagram', icon: faInstagram, className: 'instagram-btn' },
  ];

  const handleForgotPassword = async (userData, language) => {
    try {
      await axios.post('/Account/forgot-password', {
        email: userData.email,
        language: language 
      });
      setSuccessMessage(t('auth.forgotPasswordSuccess'));
      setShowSuccessModal(true);
      setShowForgotModal(false);
    } catch (error) {
      setSuccessMessage(t('auth.forgotPasswordError'));
      setShowSuccessModal(true);
    }
  };

  const toggleForm = () => {
    setAnimationClass('zoom-out');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setAnimationClass('zoom-in');
    }, 400);
  };

  const handleSocialLogin = async (platform) => {
    try {
      if (platform === 'Facebook') {
        await signInWithFacebook();
      } else if (platform === 'Google') {
        await signInWithGoogle();
      }
      onLoginSuccess();
      setModalOpen(false);
    } catch (error) {
      console.error(`Error logging in with ${platform}:`, error);
    }
  };

  const handleRegisterSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setModalOpen(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <>
      <div className="modal-overlay">
        <div className={`modal-content ${!isLogin ? 'register-mode' : ''}`}>
          <button className="close-button" onClick={() => onClose()}>{t('auth.closeModal')}</button>
          
          <div className={`form-container ${animationClass}`}>
            {isLogin ? (
              <>
                <Login onClose={onClose} onLoginSuccess={onLoginSuccess} />
                <div className="auth-options">
                  <button onClick={() => setShowForgotModal(true)} className="toggle-button">
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </>
            ) : (
              <Register 
                onClose={onClose} 
                onLoginSuccess={onLoginSuccess} 
                setModalOpen={setModalOpen} 
                onRegisterSuccess={handleRegisterSuccess} 
              />
            )}

            <div className="auth-footer">
              <p className="toggle-prompt">
                {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                <button onClick={toggleForm} className="toggle-button">
                  {isLogin ? t('auth.register') : t('auth.login')}
                </button>
              </p>

              <div className="social-login">
                {socialPlatforms.map(({ platform, icon, className }) => (
                  <button
                    key={platform}
                    onClick={() => handleSocialLogin(platform)}
                    className={`social-btn ${className}`}
                    aria-label={`Login with ${platform}`}
                  >
                    <FontAwesomeIcon icon={icon} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal
          onClose={() => setShowForgotModal(false)}
          onSubmit={handleForgotPassword}
          language={i18n.language} 
        />
      )}

      {showSuccessModal && (
        <SuccessModal 
          message={successMessage} 
          onClose={handleCloseSuccessModal}
        />
      )}
    </>
  );
};

export default AuthModal;
