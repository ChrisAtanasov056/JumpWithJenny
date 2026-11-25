import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import './AdminLayout.scss';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav aria-label="Admin navigation">
          <ul className="admin-nav">
            <li className="nav-item">
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Users
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/workouts"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Workouts
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/shoes"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Shoes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/admin/photos"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                Photos
              </NavLink>
            </li>
            <li className="nav-item">
              <Link to="/" className="nav-link">
                <span aria-hidden="true">🏠</span> Back to Main Site
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main id="main-content" className="admin-main">
        <div className="admin-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
