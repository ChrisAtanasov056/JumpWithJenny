import React, { useState } from 'react';
import { changePassword } from '../../services/authService';
import './ProfileModal.css';

const ProfileModal = ({ onClose, user, onLogout }) => {
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // Handle loading state here

  const handleChangePassword = () => {
    setPasswordModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate Inputs
    if (!currentPassword) return setError('Current password is required.');
    if (!newPassword) return setError('New password is required.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setError("New password and confirm password don't match.");

    // Set loading state before making API call
    setIsLoading(true);

    try {
      // Call changePassword API from authService.js
      await changePassword({
        id: user.id,
        currentPassword,
        newPassword
      });

      setSuccessMessage('Password changed successfully! ✅');
      setError('');
      setTimeout(handleClosePasswordModal, 2000); // Close modal after 2 seconds
    } catch (err) {
      console.error('ERROR:', err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);  // Set loading state back to false
    }
  };

  return (
    <div className="profile-modal">
      <div className="modal-content">
        <h2>Your Profile</h2>
        <p><strong>Username:</strong> {user.username || "N/A"}</p>
        <p><strong>First Name:</strong> {user.firstname || "N/A"}</p>
        <p><strong>Last Name:</strong> {user.lastname || "N/A"}</p>
        <p><strong>Email:</strong> {user.email || "N/A"}</p>

        <div className="modal-buttons">
          <button onClick={onLogout} className="logout-btn">Logout</button>
          <button onClick={onClose} className="close-btn">Close</button>
          <button onClick={handleChangePassword} className="change-password-btn">Change Password</button>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="password-modal">
          <div className="password-modal-content">
            <h3>Change Password</h3>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>} {/* Success message */}

            <form onSubmit={handlePasswordSubmit}>
              <div className="input-group">
                <label htmlFor="currentPassword">Current Password:</label>
                <input 
                  type="password" 
                  id="currentPassword" 
                  name="currentPassword" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label htmlFor="newPassword">New Password:</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  name="newPassword" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="modal-buttons">
                {isLoading ? (
                  <div className="loading-spinner">Loading...</div> // Loading spinner
                ) : (
                  <button type="submit" className="submit-btn">Change Password</button>
                )}
                <button type="button" onClick={handleClosePasswordModal} className="close-btn">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;