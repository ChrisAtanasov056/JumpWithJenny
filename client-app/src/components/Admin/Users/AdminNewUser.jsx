// src/components/Admin/Users/AdminNewUser.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserService from '../../../services/UserServices';
import './AdminNewUser.scss'; 

const AdminNewUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'User' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await UserService.createUserAdmin({
        Username: formData.username,
        Email: formData.email,
        Password: formData.password,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Role: formData.role
      });
      // Redirect to the user list page after successful creation
      navigate('/admin/users', { state: { message: t('admin.users.createSuccess') } });
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || t('admin.users.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-user-container">
      <h2 className="form-title">{t('admin.users.addNew')}</h2>
      <form onSubmit={handleSubmit} className="new-user-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">{t('admin.users.fields.username')}</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">{t('admin.users.fields.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('admin.users.fields.password')}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">{t('admin.users.fields.firstName')}</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">{t('admin.users.fields.lastName')}</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">{t('admin.users.fields.role')}</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="User">{t('admin.roles.user')}</option>
            <option value="Administrator">{t('admin.roles.admin')}</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? t('admin.users.creating') : t('admin.users.createButton')}
        </button>
      </form>
    </div>
  );
};

export default AdminNewUser;