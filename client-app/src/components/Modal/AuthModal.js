import React, { useState } from 'react';
import './AuthModal.scss';
import Login from '../Login/Login';
import Register from '../Register/Register';
import SuccessModal from '../Register/SuccessModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { signInWithFacebook, signInWithGoogle } from '../../services/firebase.js';
import { useAuth } from '../../services/AuthContext';

const AuthModal = ({ onClose, onLoginSuccess, setModalOpen }) => {
  const { user } = useAuth(); // Assuming user is stored in auth context
  const [isLogin, setIsLogin] = useState(true);
  const [animationClass, setAnimationClass] = useState('zoom-in');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const socialPlatforms = [
    { platform: 'Facebook', icon: faFacebook, className: 'fb-btn' },
    { platform: 'Google', icon: faGoogle, className: 'google-btn' },
    { platform: 'Instagram', icon: faInstagram, className: 'instagram-btn' },
  ];


  const toggleForm = () => {
    setAnimationClass('zoom-out');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setAnimationClass('zoom-in');
    }, 400); // Match the duration of the animation
  };

  const handleSocialLogin = async (platform) => {
    try {
      if (platform === 'Facebook') {
        await signInWithFacebook();
      } else if (platform === 'Google') {
        await signInWithGoogle();
      } else if (platform === 'Instagram') {
        console.log('Instagram login is not implemented');
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
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        <div className={`form-container ${animationClass}`}>
          {isLogin ? (
            <Login onClose={onClose} onLoginSuccess={onLoginSuccess} />
          ) : (
            <Register 
              onClose={onClose} ь 
              onLoginSuccess={onLoginSuccess} 
              setModalOpen={setModalOpen} 
              onRegisterSuccess={handleRegisterSuccess} 
            />
          )}
          {!user && !showSuccessModal && (
          <div>
            <p>
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
                >
                  <FontAwesomeIcon icon={icon} />
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;