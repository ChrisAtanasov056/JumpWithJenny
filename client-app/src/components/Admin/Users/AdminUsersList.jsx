import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../../services/UserServices';
import AdminUserModal from './AdminUserModal';
import './AdminUsers.scss';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus, FaSpinner } from 'react-icons/fa';

const AdminUsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setError(err.message || 'Failed to load users. Please try again.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      await UserService.updateUser(updatedUser.Id, updatedUser);
      setUsers(users.map(user => user.Id === updatedUser.Id ? updatedUser : user));
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update user.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    try {
      await UserService.deleteUser(userId);
      setUsers(users.filter(user => user.Id !== userId));
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete user.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user?.Username?.toLowerCase() || '').includes(search) ||
      (user?.Email?.toLowerCase() || '').includes(search) ||
      (user?.FirstName?.toLowerCase() || '').includes(search) ||
      (user?.LastName?.toLowerCase() || '').includes(search) ||
      (user?.Role?.toLowerCase() || '').includes(search) // Added filtering by role
    );
  });

  if (loading) {
    return (
      <div className="state-message loading-state">
        <FaSpinner className="spinner-icon" />
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-message error-state">
        <p>Error: {error}</p>
        <button className="btn-reload" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <header className="page-header">
        <h2 className="page-title">User Management</h2>
        <div className="actions-bar">
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or role..." // Updated placeholder
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search users"
            />
          </div>
          <Link to="/admin/users/new" className="btn-primary">
            <FaPlus className="btn-icon" /> Add New User
          </Link>
        </div>
      </header>

      {successMessage && (
        <div className="message-alert success-alert">
          {successMessage}
        </div>
      )}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.Id} className="user-row">
                  <td data-label="Username">{user.Username || '-'}</td>
                  <td data-label="Email">{user.Email || '-'}</td>
                  <td data-label="Full Name">{`${user.FirstName || ''} ${user.LastName || ''}`.trim() || '-'}</td>
                  <td data-label="Role">{user.Role || '-'}</td>
                  <td className="actions" data-label="Actions">
                    <button 
                      className="action-btn btn-edit"
                      onClick={() => handleViewUser(user)}
                      aria-label="Edit user"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => handleDeleteUser(user.Id)}
                      aria-label="Delete user"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-results-cell">
                  {users.length === 0 ? 'No users found.' : 'No users match your search criteria.'}
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