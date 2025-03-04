import React, { useState, useEffect } from 'react';
import { changePassword } from '../../services/authService';
import './ProfileModal.scss';

const ProfileModal = ({ onClose, user, onLogout }) => {
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isPasswordModalOpen) {
      setPasswords({ current: '', new: '', confirm: '' });
      setError('');
      setSuccessMessage('');
    }
  }, [isPasswordModalOpen]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!passwords.current) return setError('Current password is required');
    if (!passwords.new) return setError('New password is required');
    if (passwords.new.length < 6) return setError('Password must be at least 6 characters');
    if (passwords.new !== passwords.confirm) return setError("Passwords don't match");

    setIsLoading(true);

    try {
      await changePassword({
        id: user.id,
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => {
        setPasswordModalOpen(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-modal">
      {/* Main Profile Modal */}
      <div className="modal-content">
        <div className="modal-header">
          <h2>Your Profile</h2>
          <button className="close-icon" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Username</span>
            <span className="value">{user.username || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Name</span>
            <span className="value">{[user.firstname, user.lastname].join(' ') || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Email</span>
            <span className="value">{user.email || "N/A"}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setPasswordModalOpen(true)}
          >
            Change Password
          </button>
          <button className="btn btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="close-icon" 
                onClick={() => setPasswordModalOpen(false)}
                disabled={isLoading}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="alert error">{error}</div>}
              {successMessage && <div className="alert success">{successMessage}</div>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(p => ({...p, current: e.target.value}))}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(p => ({...p, new: e.target.value}))}
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(p => ({...p, confirm: e.target.value}))}
                    disabled={isLoading}
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Changing...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPasswordModalOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;