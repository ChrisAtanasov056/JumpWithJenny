import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
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
    role: 'Administrator',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await UserService.createUserAdmin({
        Username: formData.username.trim(),
        Email: formData.email.trim(),
        Password: formData.password,
        FirstName: formData.firstName.trim(),
        LastName: formData.lastName.trim(),
        Role: formData.role,
      });
      toast.success(t('admin.users.createSuccess'));
      navigate('/admin/users');
    } catch (err) {
      const apiErrors = err?.response?.data?.Errors || err?.response?.data?.errors;
      const firstErr = Array.isArray(apiErrors)
        ? apiErrors[0]?.Description || apiErrors[0]?.description || apiErrors[0]
        : null;
      setError(
        firstErr ||
          err?.response?.data?.Message ||
          err?.response?.data?.message ||
          err?.message ||
          t('admin.users.createError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-new-user-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.users.addNew').replace(/^\+\s*/, '')}</h1>
        </div>
        <Link to="/admin/users" className="adm-btn adm-btn--secondary">
          {t('admin.users.backToUsers')}
        </Link>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="adm-card new-user-card">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="username">{t('admin.users.fields.username')}</label>
            <input
              id="username"
              name="username"
              type="text"
              className="adm-input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">{t('admin.users.fields.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              className="adm-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="firstName">{t('admin.users.fields.firstName')}</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="adm-input"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="lastName">{t('admin.users.fields.lastName')}</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="adm-input"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">{t('admin.users.fields.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              className="adm-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className="field-hint">{t('admin.users.passwordHint')}</span>
          </div>

          <div className="form-field">
            <label htmlFor="role">{t('admin.users.fields.role')}</label>
            <select
              id="role"
              name="role"
              className="adm-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Administrator">{t('admin.roles.administrator')}</option>
              <option value="User">{t('admin.roles.user')}</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={() => navigate('/admin/users')}
            disabled={loading}
          >
            {t('admin.common.cancel')}
          </button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
            {loading ? t('admin.users.creating') : t('admin.users.createButton')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNewUser;
