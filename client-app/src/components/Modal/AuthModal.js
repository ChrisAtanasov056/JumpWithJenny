import React, { useState } from 'react';
import './AuthModal.css';
import Login from '../Login/Login';
import Register from '../Register/Register';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faGoogle, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { signInWithFacebook, signInWithGoogle } from '../../services/firebase.js';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [animationClass, setAnimationClass] = useState('slide-in');

  const toggleForm = () => {
    setAnimationClass('slide-out');
    setTimeout(() => {
      setIsLogin(!isLogin);
      setAnimationClass('slide-in');
    }, 500);
  };

  const handleSocialLogin = async (platform) => {
    try {
      if (platform === 'Facebook') {
        await signInWithFacebook();
      } else if (platform === 'Google') {
        await signInWithGoogle();
      } else if (platform === 'Instagram') {
        // await signInWithInstagram();
      }
      onLoginSuccess();
    } catch (error) {
      console.error(`Error logging in with ${platform}:`, error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        <div className={`form-container ${animationClass}`}>
          {isLogin ? (
            <Login onClose={onClose} onLoginSuccess={onLoginSuccess} />
          ) : (
            <Register onClose={onClose} onLoginSuccess={onLoginSuccess} />
          )}
        </div>

        <div className="social-login">
          <button className="fb-btn" onClick={() => handleSocialLogin('Facebook')}>
            <FontAwesomeIcon icon={faFacebook} />
          </button>
          <button className="google-btn" onClick={() => handleSocialLogin('Google')}>
            <FontAwesomeIcon icon={faGoogle} />
          </button>
          <button className="instagram-btn" onClick={() => handleSocialLogin('Instagram')}>
            <FontAwesomeIcon icon={faInstagram} />
          </button>
        </div>

        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={toggleForm} className="toggle-button">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
