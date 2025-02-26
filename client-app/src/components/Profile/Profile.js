import React, { useState } from 'react';
import { changePassword } from '../../services/authService';
import './ProfileModal.css';

const ProfileModal = ({ onClose, user, onLogout }) => {
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const handleChangePassword = () => {
    setPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match and validate new password
  if (newPassword !== confirmPassword) {
    setError("New password and confirm password don't match.");
    return;
  }
  if (!currentPassword) {
    setError('Current password is required.');
    return;
  }
  if (!newPassword) {
    setError('New password is required.');
    return;
  }
  if (newPassword.length < 6) {
    setError('Password must be at least 6 characters long.');
    return;
  }

    setIsLoading(true);
    try {
      const response = await changePassword({
        id: user.id,  // Ensure this comes from the correct user object
        currentPassword, 
        newPassword
      });
      console.log('TEST RESPONSE:', response);
      handleClosePasswordModal();
    } catch (err) {
      console.log('ERROR:', err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to change password. Please try again.');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-modal">
      <div className="modal-content">
        <h2>Your Profile</h2>
        <p><strong>Name:</strong> {user.name || "N/A"}</p>
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
                  <div className="loading-spinner">Loading...</div>
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
