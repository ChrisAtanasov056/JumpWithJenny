import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserService from '../../../services/UserServices';
import AdminUserModal from './AdminUserModal';
import './AdminUsers.scss';

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
        
        // Handle different response formats
        let usersData = [];
        if (Array.isArray(response)) {
          usersData = response;
        } else if (response && Array.isArray(response.Users)) {
          usersData = response.Users;
        } else if (response && response.data && Array.isArray(response.data.Users)) {
          usersData = response.data.Users;
        }
        
        setUsers(usersData || []);
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
      setUsers(users.map(user => 
        user.Id === updatedUser.Id ? updatedUser : user
      ));
      setSuccessMessage('User updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await UserService.deleteUser(userId);
      setUsers(users.filter(user => user.Id !== userId));
      setSuccessMessage('User deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete user');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Safe filtering with null checks
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      (user?.Username?.toLowerCase() || '').includes(search) ||
      (user?.Email?.toLowerCase() || '').includes(search) ||
      (user?.FirstName?.toLowerCase() || '').includes(search) ||
      (user?.LastName?.toLowerCase() || '').includes(search)
    );
  }) : [];

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="users-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
            <i className="search-icon">🔍</i>
          </div>
          <Link to="/admin/users/new" className="btn-add">
            + Add New User
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.Id}>
                  <td>{user.Username || '-'}</td>
                  <td>{user.Email || '-'}</td>
                  <td>{user.FirstName || '-'}</td>
                  <td>{user.LastName || '-'}</td>
                  <td className="actions">
                    <button 
                      className="btn-view"
                      onClick={() => handleViewUser(user)}
                    >
                      View
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.Id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  {users.length === 0 ? 'No users found' : 'No users match your search'}
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