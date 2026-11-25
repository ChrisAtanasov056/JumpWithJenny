import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserService from '../../../services/UserServices';
import AdminUserModal from './AdminUserModal';
import './AdminUserProfile.scss';

const AdminUserProfile = () => {
  const { t } = useTranslation();
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
        setError(err.message || t('admin.users.loadProfileError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, t]);

  const handleSaveUser = async (updatedUser) => {
    setActionError('');
    const savedUser = await UserService.updateUser(updatedUser.Id, updatedUser);
    setUser(savedUser?.Id ? savedUser : updatedUser);
    setSuccessMessage(t('admin.users.updateSuccess'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = async () => {
    if (window.confirm(t('admin.users.deleteConfirm'))) {
      setActionError('');
      try {
        await UserService.deleteUser(userId);
        setSuccessMessage(t('admin.users.deleteSuccess'));
        setTimeout(() => navigate('/admin/users'), 1500);
      } catch (err) {
        const serverMessage =
          err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message;
        setActionError(serverMessage || t('admin.users.deleteError'));
        setTimeout(() => setActionError(''), 5000);
      }
    }
  };

  const getRoleLabel = (role) => {
    if (!role) return t('admin.roles.unknown');
    const normalized = role.toLowerCase();
    if (normalized === 'administrator') return t('admin.roles.administrator');
    if (normalized === 'admin') return t('admin.roles.admin');
    if (normalized === 'user') return t('admin.roles.user');
    return role;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>{t('admin.users.loadingProfile')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{t('admin.common.errorPrefix')} {error}</p>
        <button onClick={() => navigate('/admin/users')}>{t('admin.users.backToUsers')}</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-not-found">
        <h3>{t('admin.users.notFound')}</h3>
        <Link to="/admin/users" className="back-button">
          {t('admin.users.backToUsers')}
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-user-profile">
      <div className="profile-header">
        <h2>{t('admin.users.detailsTitle')}</h2>
        <Link to="/admin/users" className="back-button">
          &larr; {t('admin.users.backToUsers')}
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
          <h3>{t('admin.users.basicInfo')}</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.userId')}:</span>
              <span className="info-value">{user.Id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.username')}:</span>
              <span className="info-value">{user.Username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.email')}:</span>
              <span className="info-value">{user.Email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.firstName')}:</span>
              <span className="info-value">{user.FirstName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.lastName')}:</span>
              <span className="info-value">{user.LastName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('admin.users.fields.role')}:</span>
              <span className={`info-value role ${(user.Role || '').toLowerCase()}`}>
                {getRoleLabel(user.Role)}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="btn-edit" onClick={() => setIsModalOpen(true)}>
            {t('admin.users.editButton')}
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            {t('admin.users.deleteButton')}
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