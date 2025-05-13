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

// Admin imports
import AdminLayout from './components/Admin/AdminLayout';
import AdminUsersList from './components/Admin/Users/AdminUsersList';
import AdminUserProfile from './components/Admin/Users/AdminUserProfile';
import AdminWorkoutsList from './components/Admin/Workouts/AdminWorkoutList';
import WorkoutForm from './components/Admin/Workouts/WorkoutForm';

function App() {
  useEffect(() => {
    AOS.init({ duration: 1200 });
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'Admin' && user.role !== 'Administrator') return <Navigate to="/" />;
  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar user={user} />}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/login" element={user ? <Profile user={user} /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={user ? <Profile user={user} /> : <Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route path="users/:userId" element={<AdminUserProfile />} />
          <Route path="workouts" element={<AdminWorkoutsList />} />
          <Route path="workouts/new" element={<WorkoutForm />} />
          <Route path="workouts/:id" element={<WorkoutForm />} />
          <Route path="workouts/:id/view" element={<WorkoutView />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;