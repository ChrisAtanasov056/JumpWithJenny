import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import {
  FaHome,
  FaChartBar,
  FaCalendarAlt,
  FaUserFriends,
  FaShoePrints,
  FaImages,
  FaUserShield,
  FaExternalLinkAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../../services/AuthContext';
import useModalAccessibility from '../../services/useModalAccessibility';
import 'react-toastify/dist/ReactToastify.css';
import './shared/admin-tokens.scss';
import './AdminLayout.scss';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useModalAccessibility({
    isOpen: drawerOpen,
    onClose: closeDrawer,
    modalRef: drawerRef,
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin', end: true, icon: <FaHome aria-hidden="true" />, label: t('admin.sidebar.dashboard') },
    { to: '/admin/analytics', icon: <FaChartBar aria-hidden="true" />, label: t('admin.sidebar.analytics') },
    { to: '/admin/workouts', icon: <FaCalendarAlt aria-hidden="true" />, label: t('admin.sidebar.workouts') },
    { to: '/admin/clients', icon: <FaUserFriends aria-hidden="true" />, label: t('admin.sidebar.clients') },
    { to: '/admin/shoes', icon: <FaShoePrints aria-hidden="true" />, label: t('admin.sidebar.shoes') },
    { to: '/admin/photos', icon: <FaImages aria-hidden="true" />, label: t('admin.sidebar.photos') },
    { to: '/admin/users', icon: <FaUserShield aria-hidden="true" />, label: t('admin.sidebar.users') },
  ];

  const displayName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim() ||
    user?.username ||
    user?.email ||
    t('admin.roles.administrator');

  const renderSidebarContent = (isMobileDrawer = false) => (
    <>
      <div className="sidebar-brand">
        <div className="brand-mark">
          <img src="/images/brand_logo_2.png" alt="" className="brand-logo" />
          <div className="brand-copy">
            <span className="brand-title">{t('admin.sidebar.title')}</span>
            <span className="brand-subtitle">{t('admin.sidebar.subtitle')}</span>
          </div>
        </div>
        {isMobileDrawer && (
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeDrawer}
            aria-label={t('admin.sidebar.closeMenu')}
          >
            <FaTimes aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label={t('admin.sidebar.navAriaLabel')} className="sidebar-nav-wrap">
        <ul className="admin-nav">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={isMobileDrawer ? closeDrawer : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-identity">
          <span className="identity-label">{t('admin.sidebar.signedInAs')}</span>
          <strong className="identity-name">{displayName}</strong>
        </div>

        <Link to="/" className="nav-link nav-link--utility">
          <span className="nav-icon"><FaExternalLinkAlt aria-hidden="true" /></span>
          <span>{t('admin.sidebar.backToSite')}</span>
        </Link>

        <button type="button" onClick={handleLogout} className="nav-link nav-logout-btn">
          <span className="nav-icon"><FaSignOutAlt aria-hidden="true" /></span>
          <span>{t('admin.sidebar.logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-scope admin-layout">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label={t('admin.sidebar.openMenu')}
          aria-expanded={drawerOpen}
        >
          <FaBars aria-hidden="true" />
        </button>
        <div className="mobile-brand">
          <img src="/images/brand_logo_2.png" alt="" className="mobile-brand-logo" />
          <span>{t('admin.sidebar.title')}</span>
        </div>
      </header>

      <aside className="admin-sidebar admin-sidebar--desktop">
        {renderSidebarContent(false)}
      </aside>

      {drawerOpen && (
        <div className="admin-drawer-overlay" onClick={closeDrawer} role="presentation">
          <aside
            ref={drawerRef}
            className="admin-sidebar admin-sidebar--drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('admin.sidebar.navAriaLabel')}
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      <main id="main-content" className="admin-main">
        <div className="admin-container">
          <Suspense fallback={<div className="adm-loading" role="status">{t('admin.common.loading')}</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
