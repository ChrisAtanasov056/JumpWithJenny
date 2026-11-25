import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../services/AuthContext';
import Login from '../../Login/Login';
import ForgotPasswordModal from '../../ForgotPassword/ForgotPasswordModal';
import './AdminLoginPage.scss';

const isAdminRole = (role) => role === 'Admin' || role === 'Administrator';

const AdminLoginPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  const redirectTarget = location.state?.from || '/admin/workouts';

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdminRole(user.role)) {
        navigate(redirectTarget, { replace: true });
      } else {
        logout({ skipServer: true });
        setAccessDeniedMessage(t('adminLogin.unauthorized'));
      }
    }
  }, [isAuthenticated, user, navigate, redirectTarget, logout, t]);

  const handleLoginSuccess = (loggedInUser) => {
    if (isAdminRole(loggedInUser?.role)) {
      navigate(redirectTarget, { replace: true });
    } else {
      logout({ skipServer: true });
      setAccessDeniedMessage(t('adminLogin.unauthorized'));
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/images/brand_logo_2.png" alt={t('navbar.logoAlt')} className="admin-login-logo" />
          <h1>{t('adminLogin.title')}</h1>
          <p>{t('adminLogin.subtitle')}</p>
        </div>

        {accessDeniedMessage && (
          <div className="admin-login-alert" role="alert">
            {accessDeniedMessage}
          </div>
        )}

        <Login onLoginSuccess={handleLoginSuccess} />

        <div className="admin-login-actions">
          <button
            type="button"
            className="forgot-link-btn"
            onClick={() => setShowForgotModal(true)}
          >
            {t('auth.forgotPassword')}
          </button>
          <Link to="/" className="back-home-link">
            {t('adminLogin.backToSite')}
          </Link>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};

export default AdminLoginPage;
