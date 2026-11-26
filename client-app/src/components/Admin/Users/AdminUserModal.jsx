import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import './AdminUserModal.scss';

const AdminUserModal = ({ user, onClose, onSave, onDelete }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    setEditedUser({ ...user });
    setIsEditing(false);
    setErrors({});
    setSaveError('');
    setIsSaving(false);
  }, [user]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    if (isEditing) {
      setIsEditing(false);
      setEditedUser({ ...user });
      setErrors({});
      setSaveError('');
    } else {
      onClose();
    }
  }, [isSaving, isEditing, user, onClose]);

  useOutsideClick(modalRef, onClose, Boolean(user) && !isEditing && !isSaving);
  useModalAccessibility({
    isOpen: Boolean(user),
    onClose: handleClose,
    modalRef,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
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
    if (!validateForm()) return;

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

  const getRoleLabel = (role) => {
    if (!role) return t('admin.roles.unknown');
    const normalized = role.toLowerCase();
    if (normalized === 'administrator') return t('admin.roles.administrator');
    if (normalized === 'admin') return t('admin.roles.admin');
    if (normalized === 'user') return t('admin.roles.user');
    return role;
  };

  return (
    <div className="adm-modal-overlay" role="presentation">
      <div
        ref={modalRef}
        className="adm-modal-dialog admin-user-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-header">
          <h3 id="admin-user-modal-title">
            {isEditing ? t('admin.users.editTitle') : t('admin.users.detailsTitle')}
          </h3>
          <button
            type="button"
            className="adm-modal-close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label={isEditing ? t('admin.users.cancelEditAria') : t('admin.users.closeModalAria')}
          >
            &times;
          </button>
        </div>

        <div className="user-fields-list">
          <div className="user-field-row">
            <span className="field-label">{t('admin.users.fields.username')}</span>
            {isEditing ? (
              <div className="field-input-wrap">
                <input
                  type="text"
                  name="Username"
                  className="adm-input"
                  value={editedUser.Username || ''}
                  onChange={handleInputChange}
                />
                {errors.Username && <span className="field-err">{errors.Username}</span>}
              </div>
            ) : (
              <strong>{editedUser.Username || t('admin.common.notAvailable')}</strong>
            )}
          </div>

          <div className="user-field-row">
            <span className="field-label">{t('admin.users.fields.email')}</span>
            {isEditing ? (
              <div className="field-input-wrap">
                <input
                  type="email"
                  name="Email"
                  className="adm-input"
                  value={editedUser.Email || ''}
                  onChange={handleInputChange}
                />
                {errors.Email && <span className="field-err">{errors.Email}</span>}
              </div>
            ) : (
              <span>{editedUser.Email || t('admin.common.notAvailable')}</span>
            )}
          </div>

          <div className="user-field-row">
            <span className="field-label">{t('admin.users.fields.firstName')}</span>
            {isEditing ? (
              <div className="field-input-wrap">
                <input
                  type="text"
                  name="FirstName"
                  className="adm-input"
                  value={editedUser.FirstName || ''}
                  onChange={handleInputChange}
                />
                {errors.FirstName && <span className="field-err">{errors.FirstName}</span>}
              </div>
            ) : (
              <span>{editedUser.FirstName || t('admin.common.notAvailable')}</span>
            )}
          </div>

          <div className="user-field-row">
            <span className="field-label">{t('admin.users.fields.lastName')}</span>
            {isEditing ? (
              <div className="field-input-wrap">
                <input
                  type="text"
                  name="LastName"
                  className="adm-input"
                  value={editedUser.LastName || ''}
                  onChange={handleInputChange}
                />
              </div>
            ) : (
              <span>{editedUser.LastName || t('admin.common.notAvailable')}</span>
            )}
          </div>

          <div className="user-field-row">
            <span className="field-label">{t('admin.users.fields.role')}</span>
            {isEditing ? (
              <div className="field-input-wrap">
                <select
                  name="Role"
                  className="adm-select"
                  value={editedUser.Role || 'User'}
                  onChange={handleInputChange}
                >
                  <option value="Administrator">{t('admin.roles.administrator')}</option>
                  <option value="User">{t('admin.roles.user')}</option>
                </select>
              </div>
            ) : (
              <span className="role-badge">{getRoleLabel(editedUser.Role)}</span>
            )}
          </div>
        </div>

        {saveError && <div className="adm-alert adm-alert--error">{saveError}</div>}

        <div className="user-modal-actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="adm-btn adm-btn--secondary"
                disabled={isSaving}
                onClick={handleClose}
              >
                {t('admin.common.cancel')}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--primary"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? t('admin.common.saving') : t('admin.users.saveChanges')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="adm-btn adm-btn--danger-soft"
                onClick={() => onDelete(user.Id)}
              >
                {t('admin.users.deleteButton')}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--navy"
                onClick={() => setIsEditing(true)}
              >
                {t('admin.users.editButton')}
              </button>
              <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
                {t('admin.common.close')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;
