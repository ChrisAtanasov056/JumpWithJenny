import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = ({ role }) => {
    return role === 'Administrator' ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;