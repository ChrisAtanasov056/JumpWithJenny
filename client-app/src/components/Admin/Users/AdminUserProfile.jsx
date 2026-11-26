import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import UserService from '../../../services/UserServices';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import AdminUserModal from './AdminUserModal';
import './AdminUserProfile.scss';

const AdminUserProfile = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await UserService.getUserById(userId);
        setUser(data);
      } catch (err) {
        setError(err?.message || t('admin.users.loadProfileError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, t]);

  const handleSaveUser = async (updatedUser) => {
    const savedUser = await UserService.updateUser(updatedUser.Id, updatedUser);
    setUser(savedUser?.Id ? savedUser : updatedUser);
    toast.success(t('admin.users.updateSuccess'));
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await UserService.deleteUser(userId);
      toast.success(t('admin.users.deleteSuccess'));
      navigate('/admin/users');
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message;
      toast.error(serverMessage || t('admin.users.deleteError'));
      setIsDeleting(false);
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

  if (loading) return <div className="adm-loading" role="status">{t('admin.users.loadingProfile')}</div>;
  if (error) return <div className="adm-alert adm-alert--error">{t('admin.common.errorPrefix')} {error}</div>;
  if (!user) {
    return (
      <div className="adm-empty">
        <h3>{t('admin.users.notFound')}</h3>
        <Link to="/admin/users" className="adm-btn adm-btn--secondary">
          {t('admin.users.backToUsers')}
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-user-profile-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.users.detailsTitle')}</h1>
        </div>
        <Link to="/admin/users" className="adm-btn adm-btn--secondary">
          {t('admin.users.backToUsers')}
        </Link>
      </div>

      <div className="adm-card profile-card">
        <h3>{t('admin.users.basicInfo')}</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">{t('admin.users.fields.username')}</span>
            <strong>{user.Username}</strong>
          </div>
          <div className="info-item">
            <span className="info-label">{t('admin.users.fields.email')}</span>
            <span>{user.Email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('admin.users.fields.firstName')}</span>
            <span>{user.FirstName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('admin.users.fields.lastName')}</span>
            <span>{user.LastName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t('admin.users.fields.role')}</span>
            <span>{getRoleLabel(user.Role)}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="adm-btn adm-btn--navy" onClick={() => setIsModalOpen(true)}>
            {t('admin.users.editButton')}
          </button>
          <button type="button" className="adm-btn adm-btn--danger-soft" onClick={() => setShowDeleteConfirm(true)}>
            {t('admin.users.deleteButton')}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <AdminUserModal
          user={user}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}

      <AdminConfirmModal
        isOpen={showDeleteConfirm}
        title={t('admin.users.deleteModal.title')}
        message={t('admin.users.deleteModal.prompt', { username: user.Username || user.Email })}
        warning={t('admin.users.deleteModal.warning')}
        confirmLabel={t('admin.users.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default AdminUserProfile;
