import { Outlet } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminUsersList from '../components/Admin/Users/AdminUsersList';
import AdminUserProfile from '../components/Admin/Users/AdminUserProfile';
import AdminWorkoutsList from '../components/Admin/Workouts/AdminWorkoutsList';
import WorkoutForm from '../components/Admin/Workouts/WorkoutForm';

const AdminRoutes = [
  {
    path: 'users',
    element: <AdminUsersList />,
  },
  {
    path: 'users/:userId',
    element: <AdminUserProfile />,
  },
  {
    path: 'workouts',
    element: <AdminWorkoutsList />,
  },
  {
    path: 'workouts/new',
    element: <WorkoutForm />,
  },
  {
    path: 'workouts/:id',
    element: <WorkoutForm />,
  }
];

export const adminRoutes = {
  element: <AdminLayout><Outlet /></AdminLayout>,
  children: AdminRoutes,
};