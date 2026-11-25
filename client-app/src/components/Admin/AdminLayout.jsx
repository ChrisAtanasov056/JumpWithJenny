import React, { Suspense } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '../../services/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import './AdminLayout.scss';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <ToastContainer position="top-right" autoClose={3000} />
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>{t('admin.sidebar.title')}</h2>
        </div>
        <nav aria-label={t('admin.sidebar.navAriaLabel')}>
          <ul className="admin-nav">
            <li className="nav-item">
              <NavLink
                to="/admin/workouts"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {t('admin.sidebar.workouts')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/shoes"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {t('admin.sidebar.shoes')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/photos"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {t('admin.sidebar.photos')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {t('admin.sidebar.users')}
              </NavLink>
            </li>
            <li className="nav-item">
              <Link to="/" className="nav-link">
                <span aria-hidden="true">🏠</span> {t('admin.sidebar.backToSite')}
              </Link>
            </li>
            <li className="nav-item">
              <button type="button" onClick={handleLogout} className="nav-link nav-logout-btn">
                {t('admin.sidebar.logout')}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main id="main-content" className="admin-main">
        <div className="admin-container">
          <Suspense fallback={<div className="admin-loading" role="status">{t('admin.common.loading')}</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
