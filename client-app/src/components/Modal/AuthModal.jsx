import React, { useState, useEffect } from 'react';
import './AuthModal.scss';
import Login from '../Login/Login';
import Register from '../Register/Register';
import SuccessModal from '../Register/SuccessModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import ForgotPasswordModal from '../ForgotPassword/ForgotPasswordModal';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../services/AuthContext';
import { googleLogin, facebookLogin } from '../../services/authService';
import axios from 'axios';

const AuthModal = ({ onClose, onLoginSuccess, setModalOpen }) => {
  const { t, i18n } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { googleLogin: authLogin } = useAuth();

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '24361503363512956', 
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const socialPlatforms = [
    { platform: 'Google', className: 'google-btn' },
    { platform: 'Facebook', icon: faFacebook, className: 'fb-btn' },
    { platform: 'Instagram', icon: faInstagram, className: 'instagram-btn' },
  ];

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setErrorMessage('');
    try {
      const authCode = credentialResponse.code;
      console.log('Google authorization code:', authCode);

      if (!authCode) {
        setErrorMessage(t('login.googleLoginFailed'));
        console.error('Google login error: Authorization code is null.');
        return;
      }

      const response = await googleLogin(authCode);

      if (response?.Success) {
        console.log('Google login response:', response);
        const { Token: token, RefreshToken: refreshToken, User: user } = response;
        if (user && token && refreshToken) {
          authLogin({ ...user, token, refreshToken });
          onLoginSuccess({ ...user, token, refreshToken });
          onClose();
          setSuccessMessage(t('login.successMessage'));
          setShowSuccessModal(true);
        } else {
          setErrorMessage(t('login.incompleteDataError'));
        }
      } else {
        setErrorMessage(t('login.noDataError'));
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMessage(t('login.credentialsError'));
    }
  };
  
  const handleFacebookLoginSuccess = async (accessToken) => {
    setErrorMessage('');
    try {
      const response = await facebookLogin(accessToken);

      if (response?.Success) {
        const { Token: token, RefreshToken: refreshToken, User: user } = response;
        if (user && token && refreshToken) {
          authLogin({ ...user, token, refreshToken });
          onLoginSuccess({ ...user, token, refreshToken });
          onClose();
          setSuccessMessage(t('login.successMessage'));
          setShowSuccessModal(true);
        } else {
          setErrorMessage(t('login.incompleteDataError'));
        }
      } else {
        setErrorMessage(t('login.noDataError'));
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      setErrorMessage(t('login.credentialsError'));
    }
  };

  const googleSignIn = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => setErrorMessage(t('login.googleLoginFailed')),
    flow: 'auth-code',
  });

  const handleForgotPassword = async (userData) => {
    try {
      await axios.post('/Account/forgot-password', {
        email: userData.email,
        language: i18n.language,
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
    setIsAnimating(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }, 300);
  };

  const handleSocialLogin = (platform) => {
    if (platform === 'Google') {
      googleSignIn();
    } else if (platform === 'Facebook') {
      if (window.FB) {
        window.FB.login(
          function(response) {
            if (response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              handleFacebookLoginSuccess(accessToken);
            } else {
              console.log('User cancelled login or did not fully authorize.');
              setErrorMessage(t('login.facebookLoginFailed'));
            }
          },
          { scope: 'public_profile,email' }
        );
      } else {
        console.error('Facebook SDK not loaded.');
        setErrorMessage(t('login.facebookLoginFailed'));
      }
    } else if (platform === 'Instagram') {
      console.log(`Log in with ${platform} is not implemented yet.`);
    }
  };

  const handleRegisterSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const renderSocialButtons = () => (
    <div className="social-login-section">
      {socialPlatforms.map(({ platform, icon, className }) => (
        <React.Fragment key={platform}>
          {platform === 'Google' ? (
            <button
              onClick={() => handleSocialLogin('Google')}
  onClick={() => { // <-- Отворете къдрава скоба
    console.log('Google login button clicked!');
    googleSignIn();
  }} // <-- Затворете къдрава скоба
              className={`social-btn ${className}`}
              >
              <div className="gsi-material-button-icon">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleSocialLogin(platform)}
              className={`social-btn ${className}`}
            >
              <FontAwesomeIcon icon={icon} />
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <div className="auth-modal-overlay">
        <div className={`auth-modal-card`}>
          <button className="auth-close-btn" onClick={onClose}>
            ✕
          </button>
          <div className="auth-content">
            <div className="auth-form-container">
              <div className="auth-header">
                <h2>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
                <p>{isLogin ? t('auth.welcomeBack') : t('auth.joinUs')}</p>
              </div>

              <div className={`dynamic-form ${isAnimating ? 'is-animating' : ''}`}>
                {isLogin ? (
                  <>
                    <Login onClose={onClose} onLoginSuccess={onLoginSuccess} />
                    <button
                      className="forgot-password-btn"
                      onClick={() => setShowForgotModal(true)}
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </>
                ) : (
                  <Register
                    onClose={onClose}
                    onLoginSuccess={onLoginSuccess}
                    setModalOpen={setModalOpen}
                    onRegisterSuccess={handleRegisterSuccess}
                  />
                )}
              </div>

              <div className="auth-footer">
                {errorMessage && <div className="auth-error-msg">{errorMessage}</div>}
                <div className="switch-text">
                  {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
                  <button onClick={toggleForm} className="switch-mode-btn">
                    {isLogin ? t('auth.register') : t('auth.login')}
                  </button>
                </div>
                <div className="social-text">{t('auth.orContinueWith')}</div>
                {renderSocialButtons()}
              </div>
            </div>
          </div>
        </div>

        {showForgotModal && (
          <ForgotPasswordModal
            onClose={() => setShowForgotModal(false)}
            onSubmit={handleForgotPassword}
          />
        )}
        {showSuccessModal && (
          <SuccessModal message={successMessage} onClose={handleCloseSuccessModal} />
        )}
      </div>
    </>
  );
};

export default AuthModal;
