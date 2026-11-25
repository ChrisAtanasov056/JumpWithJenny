import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Navbar from './components/NavBar/NavBar';
import Home from './components/Home/Home';
import AuthModal from './components/Modal/AuthModal';
import Schedule from './components/Schedule/Schedule';
import AboutMe from './components/AboutMe/AboutMe';
import FAQ from './components/FAQ/FAQ';
import Contacts from './components/Contacts/Contacts';
import AOS from 'aos';
import Profile from './components/Profile/Profile';
import VerifyEmail from './services/VerifyEmail';
import Gallery from './components/Gallery/Gallery';
import ResetPassword from './components/ForgotPassword/ResetPassword';
import WorkoutView from './components/Admin/Workouts/WorkoutView';
import './i18n';
import { useTranslation } from 'react-i18next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FacebookSDKProvider } from './services/FacebookSDKContext.jsx';
import AdminLayout from './components/Admin/AdminLayout';
import AdminUsersList from './components/Admin/Users/AdminUsersList';
import AdminUserProfile from './components/Admin/Users/AdminUserProfile';
import AdminWorkoutsList from './components/Admin/Workouts/AdminWorkoutList';
import WorkoutForm from './components/Admin/Workouts/WorkoutForm';
import HappyCustomers from './components/HappyCustomers/HappyCustomers';
import DataDeletion from './components/DataDeletionPage/DataDeletionPage.jsx';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import PhotosManagement from './components/Admin/PhotosManagement/PhotosManagement';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminNewUser from './components/Admin/Users/AdminNewUser.jsx';
import AdminShoesList from './components/Admin/Shoes/AdminShoesList';
import AdminShoeForm from './components/Admin/Shoes/AdminShoeForm';
import ShoeDetailsView from './components/Admin/Shoes/ShoeDetailsView';
import NotFoundPage from './components/404/NotFoundPage';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);

  useEffect(() => {
    const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];
    document.documentElement.lang = activeLang;
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <FacebookSDKProvider>
          <HelmetProvider>
            <ToastContainer position="top-right" autoClose={3000} />
            <Router>
              <AppContent />
            </Router>
          </HelmetProvider>
        </FacebookSDKProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin' && user.role !== 'Administrator') return <Navigate to="/" replace />;
  return children;
};

const AuthRoutePage = ({ mode }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = location.state?.from || '/';

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="route-modal-page">
      <AuthModal
        initialMode={mode}
        onClose={() => navigate('/')}
        onLoginSuccess={() => navigate(redirectTarget, { replace: true })}
      />
    </div>
  );
};

const ProfileRoutePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: '/profile' }} replace />;
  }

  return (
    <div className="route-modal-page">
      <Profile
        user={user}
        onClose={() => navigate('/')}
        onLogout={() => {
          logout();
          navigate('/');
        }}
      />
    </div>
  );
};

const StandaloneSection = ({ children }) => (
  <div className="standalone-page-offset">{children}</div>
);

const NO_INDEX_PAGES = [
  '/data-deletion',
  '/privacy-policy',
  '/terms-of-service',
  '/login',
  '/register',
  '/verify-email',
  '/reset-password',
  '/profile',
];

const CanonicalLink = () => {
  const location = useLocation();
  let path = location.pathname;

  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  if (path.startsWith('/admin') || NO_INDEX_PAGES.includes(path)) {
    return (
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  const canonicalUrl = `https://jumpwithjenny.com${path}`;
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const routesElement = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<StandaloneSection><AboutMe /></StandaloneSection>} />
      <Route path="/gallery" element={<StandaloneSection><Gallery /></StandaloneSection>} />
      <Route path="/faq" element={<StandaloneSection><FAQ /></StandaloneSection>} />
      <Route path="/contacts" element={<StandaloneSection><Contacts /></StandaloneSection>} />
      <Route path="/schedule" element={<StandaloneSection><Schedule /></StandaloneSection>} />
      <Route path="/customers" element={<StandaloneSection><HappyCustomers /></StandaloneSection>} />
      <Route path="/login" element={<AuthRoutePage mode="login" />} />
      <Route path="/register" element={<AuthRoutePage mode="register" />} />
      <Route path="/profile" element={<ProfileRoutePage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/data-deletion" element={<DataDeletion />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersList />} />
        <Route path="users/new" element={<AdminNewUser />} />
        <Route path="users/:userId" element={<AdminUserProfile />} />
        <Route path="workouts" element={<AdminWorkoutsList />} />
        <Route path="workouts/new" element={<WorkoutForm />} />
        <Route path="workouts/:id" element={<WorkoutForm />} />
        <Route path="workouts/:id/view" element={<WorkoutView />} />
        <Route path="photos" element={<PhotosManagement />} />
        <Route path="shoes" element={<AdminShoesList />} />
        <Route path="shoes/new" element={<AdminShoeForm />} />
        <Route path="shoes/:id" element={<AdminShoeForm />} />
        <Route path="shoes/details/:id" element={<ShoeDetailsView />} />
        <Route path="analytics" element={<Navigate to="/admin/users" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  return (
    <>
      <CanonicalLink />
      <a href="#main-content" className="skip-to-content">
        {t('skipToContent')}
      </a>
      {!isAdminRoute && <Navbar user={user} />}
      {isAdminRoute ? routesElement : <main id="main-content">{routesElement}</main>}
    </>
  );
};

export default App;
