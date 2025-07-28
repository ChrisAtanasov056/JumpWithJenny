// src/components/ResetPassword/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SuccessModal from '../Register/SuccessModal';
import '../Modal/AuthModal.scss';
import { forgotPassword } from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get token and email from URL parameters
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    console.log("Token: " , token) 
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const response = await forgotPassword({ 
        token: token,
        email: email,
        newPassword: passwords.newPassword
      })
      console.log("Resposnse: ", response)
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };




  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="form-container">
          {!showSuccess ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Reset Password</h2>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {errorMessage && <p className="error-message">⚠️ {errorMessage}</p>}

              <button 
                type="submit" 
                className="auth-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <SuccessModal 
              message="Password reset successfully!" 
              onClose={() => navigate('/')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;