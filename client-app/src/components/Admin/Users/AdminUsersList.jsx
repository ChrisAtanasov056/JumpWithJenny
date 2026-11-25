import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserService from '../../../services/UserServices';
import AdminUserModal from './AdminUserModal';
import './AdminUsers.scss';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus, FaSpinner } from 'react-icons/fa';

const AdminUsersList = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UserService.getAllUsers();
        let usersData = Array.isArray(response) ? response : (response?.Users || response?.data?.Users || []);
        // Make sure the backend response includes a 'Role' property for each user
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message || t('admin.users.loadError'));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [t]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (updatedUser) => {
    setActionError('');
    const savedUser = await UserService.updateUser(updatedUser.Id, updatedUser);
    const mergedUser = savedUser?.Id ? savedUser : updatedUser;
    setUsers(prev => prev.map(user => (user.Id === mergedUser.Id ? mergedUser : user)));
    setSelectedUser(mergedUser);
    setSuccessMessage(t('admin.users.updateSuccess'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('admin.users.deleteConfirm'))) {
      return;
    }
    setActionError('');
    try {
      await UserService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.Id !== userId));
      setSuccessMessage(t('admin.users.deleteSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message;
      setActionError(serverMessage || t('admin.users.deleteError'));
      setTimeout(() => setActionError(''), 5000);
    }
  };

  const getRoleLabel = (role) => {
    if (!role) return '-';
    const normalized = role.toLowerCase();
    if (normalized === 'administrator') return t('admin.roles.administrator');
    if (normalized === 'admin') return t('admin.roles.admin');
    if (normalized === 'user') return t('admin.roles.user');
    return role;
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user?.Username?.toLowerCase() || '').includes(search) ||
      (user?.Email?.toLowerCase() || '').includes(search) ||
      (user?.FirstName?.toLowerCase() || '').includes(search) ||
      (user?.LastName?.toLowerCase() || '').includes(search) ||
      (user?.Role?.toLowerCase() || '').includes(search) ||
      getRoleLabel(user?.Role).toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="state-message loading-state">
        <FaSpinner className="spinner-icon" />
        <p>{t('admin.users.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-message error-state">
        <p>{t('admin.common.errorPrefix')} {error}</p>
        <button className="btn-reload" onClick={() => window.location.reload()}>{t('admin.common.tryAgain')}</button>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <header className="page-header">
        <h2 className="page-title">{t('admin.users.title')}</h2>
        <div className="actions-bar">
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label={t('admin.users.searchAriaLabel')}
            />
          </div>
          <Link to="/admin/users/new" className="btn-primary">
            <FaPlus className="btn-icon" /> {t('admin.users.addNew')}
          </Link>
        </div>
      </header>

      {successMessage && (
        <div className="message-alert success-alert">
          {successMessage}
        </div>
      )}

      {actionError && (
        <div className="message-alert error-alert">
          {actionError}
        </div>
      )}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('admin.users.table.username')}</th>
              <th>{t('admin.users.table.email')}</th>
              <th>{t('admin.users.table.fullName')}</th>
              <th>{t('admin.users.table.role')}</th>
              <th>{t('admin.users.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.Id} className="user-row">
                  <td data-label={t('admin.users.table.username')}>{user.Username || '-'}</td>
                  <td data-label={t('admin.users.table.email')}>{user.Email || '-'}</td>
                  <td data-label={t('admin.users.table.fullName')}>{`${user.FirstName || ''} ${user.LastName || ''}`.trim() || '-'}</td>
                  <td data-label={t('admin.users.table.role')}>{getRoleLabel(user.Role)}</td>
                  <td className="actions" data-label={t('admin.users.table.actions')}>
                    <button 
                      className="action-btn btn-edit"
                      onClick={() => handleViewUser(user)}
                      aria-label={t('admin.users.editAriaLabel')}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => handleDeleteUser(user.Id)}
                      aria-label={t('admin.users.deleteAriaLabel')}
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-results-cell">
                  {users.length === 0 ? t('admin.users.noUsers') : t('admin.users.noMatchingUsers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedUser && (
        <AdminUserModal 
          user={selectedUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default AdminUsersList;