import React, { useState } from 'react';
import './AuthModal.scss';
import Login from '../Login/Login';
import Register from '../Register/Register';
import SuccessModal from '../Register/SuccessModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { signInWithFacebook, signInWithGoogle } from '../../services/firebase.js';
import { useAuth } from '../../services/AuthContext'; 
import ForgotPasswordModal from '../ForgotPassword/ForgotPasswordModal.js';
import axios from 'axios';

const AuthModal = ({ onClose, onLoginSuccess, setModalOpen }) => {
  const { user } = useAuth();
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

  const handleForgotPassword = async (email) => {
    try {
      await axios.post('https://localhost:7024/Account/forgot-password', { email });
      setSuccessMessage('If an account exists, a password reset email has been sent.');
      setShowSuccessModal(true);
      setShowForgotModal(false);
    } catch (error) {
      setSuccessMessage('Error sending reset email. Please try again.');
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
    setShowSuccessModal(true); // Show success modal
    setModalOpen(false); // Close the main modal immediately
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false); // Close the success modal
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-button" onClick={() => { console.log('Modal close clicked'); onClose(); }}>X</button>
          
          <div className={`form-container ${animationClass}`}>
            {isLogin ? (
              <>
                <Login onClose={onClose} onLoginSuccess={onLoginSuccess} />
                <div className="auth-options">
                  <button onClick={() => setShowForgotModal(true)} className="toggle-button">
                    Forgot Password?
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
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={toggleForm} className="toggle-button">
                  {isLogin ? 'Register' : 'Login'}
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
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} onSubmit={handleForgotPassword} />
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