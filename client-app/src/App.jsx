import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Navbar from './components/NavBar/NavBar';
import Home from './components/Home/Home';
import Schedule from './components/Schedule/Schedule';
import AboutMe from './components/AboutMe/AboutMe';
import FAQ from './components/FAQ/FAQ';
import Contacts from './components/Contacts/Contacts';
import Gallery from './components/Gallery/Gallery';
import ResetPassword from './components/ForgotPassword/ResetPassword';
import './i18n';
import { useTranslation } from 'react-i18next';
import HappyCustomers from './components/HappyCustomers/HappyCustomers';
import DataDeletion from './components/DataDeletionPage/DataDeletionPage.jsx';
import CancelBookingPage from './components/CancelBooking/CancelBookingPage';
import AdminLoginPage from './components/Admin/Login/AdminLoginPage';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import NotFoundPage from './components/404/NotFoundPage';
import AltitudeShell from './components/AltitudeShell/AltitudeShell';
import './styles/altitude-tokens.scss';

const AdminLayout = lazy(() => import('./components/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/Admin/Dashboard/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./components/Admin/Analytics/AdminAnalytics'));
const AdminClientsList = lazy(() => import('./components/Admin/Clients/AdminClientsList'));
const AdminUsersList = lazy(() => import('./components/Admin/Users/AdminUsersList'));
const AdminNewUser = lazy(() => import('./components/Admin/Users/AdminNewUser.jsx'));
const AdminUserProfile = lazy(() => import('./components/Admin/Users/AdminUserProfile'));
const AdminWorkoutsList = lazy(() => import('./components/Admin/Workouts/AdminWorkoutList'));
const WorkoutForm = lazy(() => import('./components/Admin/Workouts/WorkoutForm'));
const WorkoutView = lazy(() => import('./components/Admin/Workouts/WorkoutView'));
const PhotosManagement = lazy(() => import('./components/Admin/PhotosManagement/PhotosManagement'));
const AdminReviewsList = lazy(() => import('./components/Admin/Reviews/AdminReviewsList'));
const AdminShoesList = lazy(() => import('./components/Admin/Shoes/AdminShoesList'));
const AdminShoeForm = lazy(() => import('./components/Admin/Shoes/AdminShoeForm'));
const ShoeDetailsView = lazy(() => import('./components/Admin/Shoes/ShoeDetailsView'));
const ConceptsDemo = lazy(() => import('./components/ConceptsDemo/ConceptsDemo'));
const AltitudeDemo = lazy(() => import('./components/ConceptsDemo/AltitudeDemo'));
const ReboundDemo = lazy(() => import('./components/ReboundDemo/ReboundDemo'));

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];
    document.documentElement.lang = activeLang;
  }, [i18n.language, i18n.resolvedLanguage]);

  return (
    <AuthProvider>
      <HelmetProvider>
        <Router>
          <AppContent />
        </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== 'Admin' && user.role !== 'Administrator') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const StandaloneSection = ({ children }) => (
  <div className="standalone-page-offset">{children}</div>
);

const NO_INDEX_PAGES = [
  '/data-deletion',
  '/privacy-policy',
  '/terms-of-service',
  '/reset-password',
  '/admin/login',
  '/concepts-demo',
  '/altitude-demo',
  '/rebound-demo',
];

const CanonicalLink = () => {
  const location = useLocation();
  let path = location.pathname;

  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  if (
    path.startsWith('/admin') ||
    path.startsWith('/cancel-booking') ||
    NO_INDEX_PAGES.includes(path)
  ) {
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
  const { t } = useTranslation();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDemoRoute =
    location.pathname.startsWith('/concepts-demo') ||
    location.pathname.startsWith('/altitude-demo') ||
    location.pathname.startsWith('/rebound-demo');

  const routesElement = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/concepts-demo"
        element={
          <Suspense fallback={<div className="admin-loading" role="status">{t('common.loading')}</div>}>
            <ConceptsDemo />
          </Suspense>
        }
      />
      <Route
        path="/altitude-demo"
        element={
          <Suspense fallback={<div className="admin-loading" role="status">{t('common.loading')}</div>}>
            <AltitudeDemo />
          </Suspense>
        }
      />
      <Route
        path="/rebound-demo"
        element={
          <Suspense fallback={<div className="admin-loading" role="status">{t('common.loading')}</div>}>
            <ReboundDemo />
          </Suspense>
        }
      />
      <Route path="/about" element={<StandaloneSection><AboutMe /></StandaloneSection>} />
      <Route path="/gallery" element={<StandaloneSection><Gallery /></StandaloneSection>} />
      <Route path="/faq" element={<StandaloneSection><FAQ /></StandaloneSection>} />
      <Route path="/contacts" element={<StandaloneSection><Contacts /></StandaloneSection>} />
      <Route path="/schedule" element={<StandaloneSection><Schedule /></StandaloneSection>} />
      <Route path="/customers" element={<StandaloneSection><HappyCustomers /></StandaloneSection>} />
      <Route path="/cancel-booking/:token" element={<StandaloneSection><CancelBookingPage /></StandaloneSection>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/data-deletion" element={<DataDeletion />} />

      {/* Hidden admin login route */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <Suspense fallback={<div className="admin-loading" role="status">{t('admin.common.loading')}</div>}>
              <AdminLayout />
            </Suspense>
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clients" element={<AdminClientsList />} />
        <Route path="users" element={<AdminUsersList />} />
        <Route path="users/new" element={<AdminNewUser />} />
        <Route path="users/:userId" element={<AdminUserProfile />} />
        <Route path="workouts" element={<AdminWorkoutsList />} />
        <Route path="workouts/new" element={<WorkoutForm />} />
        <Route path="workouts/:id" element={<WorkoutForm />} />
        <Route path="workouts/:id/view" element={<WorkoutView />} />
        <Route path="photos" element={<PhotosManagement />} />
        <Route path="reviews" element={<AdminReviewsList />} />
        <Route path="shoes" element={<AdminShoesList />} />
        <Route path="shoes/new" element={<AdminShoeForm />} />
        <Route path="shoes/:id" element={<AdminShoeForm />} />
        <Route path="shoes/details/:id" element={<ShoeDetailsView />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  const publicContent = (
    <AltitudeShell showAltimeter={location.pathname === '/'}>
      <Navbar />
      <main id="main-content">{routesElement}</main>
    </AltitudeShell>
  );

  return (
    <>
      <CanonicalLink />
      <a href="#main-content" className="skip-to-content">
        {t('skipToContent')}
      </a>
      {isAdminRoute || isDemoRoute ? routesElement : publicContent}
    </>
  );
};

export default App;
