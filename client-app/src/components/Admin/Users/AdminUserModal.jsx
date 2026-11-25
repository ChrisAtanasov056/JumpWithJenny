import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useModalAccessibility from '../../../services/useModalAccessibility';
import './AdminUserModal.scss';

const AdminUserModal = ({ user, onClose, onSave, onDelete }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setEditedUser({ ...user });
    setIsEditing(false);
    setErrors({});
    setSaveError('');
    setIsSaving(false);
    setShowDeleteConfirm(false);
  }, [user]);

  const handleEscapeOrClose = useCallback(() => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else if (isEditing) {
      setIsEditing(false);
      setEditedUser({ ...user });
      setErrors({});
      setSaveError('');
    } else {
      onClose();
    }
  }, [showDeleteConfirm, isEditing, user, onClose]);

  useModalAccessibility({
    isOpen: Boolean(user),
    onClose: handleEscapeOrClose,
    modalRef,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!editedUser.Username?.trim()) {
      newErrors.Username = t('admin.users.validation.usernameRequired');
    }
    
    if (!editedUser.Email?.trim()) {
      newErrors.Email = t('admin.users.validation.emailRequired');
    } else if (!/^\S+@\S+\.\S+$/.test(editedUser.Email)) {
      newErrors.Email = t('admin.users.validation.emailInvalid');
    }
    
    if (!editedUser.FirstName?.trim()) {
      newErrors.FirstName = t('admin.users.validation.firstNameRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({
        Id: editedUser.Id,
        Username: editedUser.Username?.trim(),
        Email: editedUser.Email?.trim(),
        FirstName: editedUser.FirstName?.trim(),
        LastName: editedUser.LastName?.trim() || '',
        Role: editedUser.Role || 'User',
      });
      setIsEditing(false);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message;
      setSaveError(serverMessage || t('admin.users.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(user.Id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const getRoleClass = () => {
    if (!editedUser.Role) return 'unknown';
    return editedUser.Role.toLowerCase();
  };

  const getRoleLabel = (role) => {
    if (!role) return t('admin.roles.unknown');
    const normalized = role.toLowerCase();
    if (normalized === 'administrator') return t('admin.roles.administrator');
    if (normalized === 'admin') return t('admin.roles.admin');
    if (normalized === 'user') return t('admin.roles.user');
    return role;
  };
  
  return (
    <div className="admin-user-modal">
      <div 
        className="modal-overlay" 
        onClick={isEditing || showDeleteConfirm ? undefined : onClose}
        aria-hidden="true"
      />
      
      <div 
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {showDeleteConfirm ? (
          <div className="delete-confirmation">
            <h3>{t('admin.users.deleteModal.title')}</h3>
            <p>{t('admin.users.deleteModal.prompt', { username: user.Username })}</p>
            <p className="warning-text">{t('admin.users.deleteModal.warning')}</p>
            
            <div className="confirmation-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('admin.common.cancel')}
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleDeleteConfirm}
              >
                {t('admin.users.deleteModal.confirm')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button 
              className="close-button"
              onClick={isEditing ? () => {
                setIsEditing(false);
                setEditedUser({ ...user });
                setErrors({});
                setSaveError('');
              } : onClose}
              aria-label={isEditing ? t('admin.users.cancelEditAria') : t('admin.users.closeModalAria')}
            >
              &times;
            </button>
            
            <h3 id="modal-title">
              {isEditing ? t('admin.users.editTitle') : t('admin.users.detailsTitle')}
            </h3>
            
            <div className="user-details">
            <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.id')}:</span>
            <span className="detail-value">{user.Id || t('admin.common.notAvailable')}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.username')}:</span>
            {isEditing ? (
              <div className="edit-field">
                <input
                  type="text"
                  name="Username"
                  value={editedUser.Username || ''}
                  onChange={handleInputChange}
                  className={errors.Username ? 'error' : ''}
                />
                {errors.Username && (
                  <span className="error-message">{errors.Username}</span>
                )}
              </div>
            ) : (
              <span className="detail-value">{editedUser.Username || t('admin.common.notAvailable')}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.email')}:</span>
            {isEditing ? (
              <div className="edit-field">
                <input
                  type="email"
                  name="Email"
                  value={editedUser.Email || ''}
                  onChange={handleInputChange}
                  className={errors.Email ? 'error' : ''}
                />
                {errors.Email && (
                  <span className="error-message">{errors.Email}</span>
                )}
              </div>
            ) : (
              <span className="detail-value">
                {editedUser.Email ? (
                  <a href={`mailto:${editedUser.Email}`}>{editedUser.Email}</a>
                ) : (
                  t('admin.common.notAvailable')
                )}
              </span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.firstName')}:</span>
            {isEditing ? (
              <div className="edit-field">
                <input
                  type="text"
                  name="FirstName"
                  value={editedUser.FirstName || ''}
                  onChange={handleInputChange}
                  className={errors.FirstName ? 'error' : ''}
                />
                {errors.FirstName && (
                  <span className="error-message">{errors.FirstName}</span>
                )}
              </div>
            ) : (
              <span className="detail-value">{editedUser.FirstName || t('admin.common.notAvailable')}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.lastName')}:</span>
            {isEditing ? (
              <div className="edit-field">
                <input
                  type="text"
                  name="LastName"
                  value={editedUser.LastName || ''}
                  onChange={handleInputChange}
                />
              </div>
            ) : (
              <span className="detail-value">{editedUser.LastName || t('admin.common.notAvailable')}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">{t('admin.users.fields.role')}:</span>
            {isEditing ? (
              <div className="edit-field">
                <select
                  name="Role"
                  value={editedUser.Role || 'User'}
                  onChange={handleInputChange}
                >
                  <option value="Administrator">{t('admin.roles.administrator')}</option>
                  <option value="User">{t('admin.roles.user')}</option>
                </select>
              </div>
            ) : (
              <span className={`detail-value role-badge ${getRoleClass()}`}>
                {getRoleLabel(editedUser.Role)}
              </span>
            )}
          </div>
            </div>

            {saveError && (
              <div className="error-message" style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {saveError}
              </div>
            )}

            <div className="modal-actions">
              {isEditing ? (
                <>
                  <button 
                    className="btn-cancel"
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditing(false);
                      setEditedUser({ ...user });
                      setErrors({});
                      setSaveError('');
                    }}
                  >
                    {t('admin.common.cancel')}
                  </button>
                  <button 
                    className="btn-save"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? t('admin.common.saving') : t('admin.users.saveChanges')}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn-delete"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t('admin.users.deleteButton')}
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    {t('admin.users.editButton')}
                  </button>
                  <button 
                    className="btn-close"
                    onClick={onClose}
                  >
                    {t('admin.common.close')}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUserModal;