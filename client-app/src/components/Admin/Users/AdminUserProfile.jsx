import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import UserService from '../../../services/UserServices';
import AdminUserModal from './AdminUserModal';
import './AdminUserProfile.scss';

const AdminUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await UserService.getUserById(userId);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Неуспешно зареждане на данните за потребителя.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSaveUser = async (updatedUser) => {
    setActionError('');
    const savedUser = await UserService.updateUser(updatedUser.Id, updatedUser);
    setUser(savedUser?.Id ? savedUser : updatedUser);
    setSuccessMessage('Потребителят е обновен успешно!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = async () => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този потребител?')) {
      setActionError('');
      try {
        await UserService.deleteUser(userId);
        setSuccessMessage('Потребителят е изтрит успешно!');
        setTimeout(() => navigate('/admin/users'), 1500);
      } catch (err) {
        const serverMessage =
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message;
        setActionError(serverMessage || 'Неуспешно изтриване на потребителя.');
        setTimeout(() => setActionError(''), 5000);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/admin/users')}>Back to Users</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-not-found">
        <h3>User not found</h3>
        <Link to="/admin/users" className="back-button">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-user-profile">
      <div className="profile-header">
        <h2>User Details</h2>
        <Link to="/admin/users" className="back-button">
          &larr; Back to Users
        </Link>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {actionError && (
        <div className="error-message">
          {actionError}
        </div>
      )}
      
      <div className="profile-card">
        <div className="profile-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{user.Id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username:</span>
              <span className="info-value">{user.Username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.Email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">First Name:</span>
              <span className="info-value">{user.FirstName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Name:</span>
              <span className="info-value">{user.LastName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className={`info-value role ${(user.Role || '').toLowerCase()}`}>
                {user.Role || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="btn-edit" onClick={() => setIsModalOpen(true)}>
            Edit User
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            Delete User
          </button>
        </div>
      </div>

      {isModalOpen && (
        <AdminUserModal
          user={user}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default AdminUserProfile;