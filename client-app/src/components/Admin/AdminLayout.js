import React from 'react';
import { Outlet, Link } from "react-router-dom";
import './AdminLayout.scss';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav>
          <ul className="admin-nav">
            <li className="nav-item">
              <Link to="/admin" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/users" className="nav-link">Users</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/workouts" className="nav-link">Workouts</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/analytics" className="nav-link">Analytics</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-main">
        <div className="admin-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;