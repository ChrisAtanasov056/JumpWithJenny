import React, { useState, useEffect } from 'react';
import './AdminUserModal.scss';

const AdminUserModal = ({ user, onClose, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setEditedUser({ ...user });
    setIsEditing(false);
    setErrors({});
    setSaveError('');
    setIsSaving(false);
    setShowDeleteConfirm(false);
  }, [user]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, user, onClose, showDeleteConfirm]);

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
      newErrors.Username = 'Username is required';
    }
    
    if (!editedUser.Email?.trim()) {
      newErrors.Email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(editedUser.Email)) {
      newErrors.Email = 'Invalid email format';
    }
    
    if (!editedUser.FirstName?.trim()) {
      newErrors.FirstName = 'First name is required';
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
      setSaveError(serverMessage || 'Неуспешно запазване на промените.');
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


  
  return (
    <div className="admin-user-modal">
      <div 
        className="modal-overlay" 
        onClick={isEditing || showDeleteConfirm ? null : onClose}
        role="button"
        aria-label={isEditing || showDeleteConfirm ? null : "Close modal"}
        tabIndex={isEditing || showDeleteConfirm ? -1 : 0}
      />
      
      <div 
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {showDeleteConfirm ? (
          <div className="delete-confirmation">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete {user.Username}?</p>
            <p className="warning-text">This action cannot be undone.</p>
            
            <div className="confirmation-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-confirm"
                onClick={handleDeleteConfirm}
              >
                Delete User
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
              aria-label={isEditing ? "Cancel editing" : "Close modal"}
            >
              &times;
            </button>
            
            <h3 id="modal-title">
              {isEditing ? 'Edit User' : 'User Details'}
            </h3>
            
            <div className="user-details">
            <div className="detail-row">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{user.Id || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Username:</span>
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
              <span className="detail-value">{editedUser.Username || 'N/A'}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Email:</span>
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
                  'N/A'
                )}
              </span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">First Name:</span>
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
              <span className="detail-value">{editedUser.FirstName || 'N/A'}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Last Name:</span>
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
              <span className="detail-value">{editedUser.LastName || 'N/A'}</span>
            )}
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Role:</span>
            {isEditing ? (
              <div className="edit-field">
                <select
                  name="Role"
                  value={editedUser.Role || 'User'}
                  onChange={handleInputChange}
                >
                  <option value="Administrator">Administrator</option>
                  <option value="User">User</option>
                </select>
              </div>
            ) : (
              <span className={`detail-value role-badge ${getRoleClass()}`}>
                {editedUser.Role || 'Unknown'}
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
                    Cancel
                  </button>
                  <button 
                    className="btn-save"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? 'Запазване...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn-delete"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete User
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit User
                  </button>
                  <button 
                    className="btn-close"
                    onClick={onClose}
                  >
                    Close
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