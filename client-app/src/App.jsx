import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Navbar from './components/NavBar/NavBar';
import Home from './components/Home/Home';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
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
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FacebookSDKProvider } from './services/FacebookSDKContext.jsx';
import AdminLayout from './components/Admin/AdminLayout';
import AdminUsersList from './components/Admin/Users/AdminUsersList';
import AdminUserProfile from './components/Admin/Users/AdminUserProfile';
import AdminWorkoutsList from './components/Admin/Workouts/AdminWorkoutList';
import WorkoutForm from './components/Admin/Workouts/WorkoutForm';
import HappyCustomers from './components/HappyCustomers/HappyCustomers';
import Footer from './components/Footer/Footer';
import DataDeletion from './components/DataDeletionPage/DataDeletionPage.jsx';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import PhotosManagement from './components/Admin/PhotosManagement/PhotosManagement';
import { ToastContainer } from 'react-toastify';
import AdminNewUser from './components/Admin/Users/AdminNewUser.jsx';
import AdminShoesList from './components/Admin/Shoes/AdminShoesList'; 
import AdminShoeForm from './components/Admin/Shoes/AdminShoeForm';
import ShoeDetailsView from './components/Admin/Shoes/ShoeDetailsView';

function App() {
  useEffect(() => {
    AOS.init({ duration: 1200 });
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <FacebookSDKProvider>
          <HelmetProvider>
           <ToastContainer />
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

  if (!user) return <Navigate to="/" />;
  if (user.role !== 'Admin' && user.role !== 'Administrator') return <Navigate to="/" />;
  return children;
};

// Pages that should be explicitly excluded from indexing.
const NO_INDEX_PAGES = [
  '/data-deletion',
  '/contacts',
  '/privacy-policy', 
  '/terms-of-service',
  '/login',
  '/register',
  '/verify-email',
  '/reset-password',
  '/profile'
];

/**
 * Handles the generation of the Canonical Link and NoIndex meta tag.
 * It removes trailing slashes (except for the homepage) to enforce one canonical URL.
 */
const CanonicalLink = () => {
  const location = useLocation();
  let path = location.pathname;

  // Normalize path: Remove trailing slash if it's not the homepage.
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Apply noindex/nofollow for Admin routes or specific utility pages
  if (path.startsWith('/admin') || NO_INDEX_PAGES.includes(path)) {
    return (
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  // Apply Canonical link for all other pages
  const canonicalUrl = `https://jumpwithjenny.com${path}`;
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <CanonicalLink />
      
      {!isAdminRoute && <Navbar user={user} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/customers" element={<HappyCustomers />} />
        <Route path="/login" element={user ? <Profile user={user} /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Login />} />
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
          <Route path="/admin/shoes/details/:id" element={<ShoeDetailsView />} />
        </Route>
      </Routes>

    </>
  );
};

export default App;
