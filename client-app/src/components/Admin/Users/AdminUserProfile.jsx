import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import UserService from '../../../services/UserServices';
import './AdminUserProfile.scss';

const AdminUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await UserService.getUserById(userId);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await UserService.deleteUser(userId);
        setSuccessMessage('User deleted successfully');
        setTimeout(() => navigate('/admin/users'), 1500);
      } catch (error) {
        setError(error.message || 'Failed to delete user');
        setTimeout(() => setError(''), 5000);
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

      {error && (
        <div className="error-message">
          {error}
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
              <span className={`info-value role ${user.Role.toLowerCase()}`}>
                {user.Role}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <Link to={`/admin/users/${user.Id}/edit`} className="btn-edit">
            Edit User
          </Link>
          <button className="btn-delete" onClick={handleDelete}>
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfile;