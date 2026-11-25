import React, { useState, useEffect, useRef, useCallback } from 'react';
import './NavBar.scss';
import { useAuth } from '../../services/AuthContext';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageDropdown from '../lang/LanguageDropdown.tsx';
import useOutsideClick from '../../services/useOutsideClick';

const NAV_SECTIONS = [
  { id: 'welcome', key: 'navbar.home' },
  { id: 'about', key: 'navbar.about' },
  { id: 'gallery', key: 'navbar.gallery' },
  { id: 'schedule', key: 'navbar.schedule' },
  { id: 'faq', key: 'navbar.faq' },
  { id: 'contacts', key: 'navbar.contact' },
];

const Navbar = () => {
  const [menuActive, setMenuActive] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  const closeMenu = useCallback(() => {
    setMenuActive(false);
  }, []);

  const toggleMenu = () => {
    setMenuActive((prev) => !prev);
  };

  useOutsideClick(navRef, closeMenu, menuActive);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!menuActive) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 991) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuActive, closeMenu]);

  const handleSectionNav = (event, sectionId) => {
    event.preventDefault();
    closeMenu();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (location.pathname === '/') {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
      const nextUrl = sectionId === 'welcome' ? '/' : `/#${sectionId}`;
      window.history.replaceState(null, '', nextUrl);
    } else {
      navigate(sectionId === 'welcome' ? '/' : `/#${sectionId}`, {
        state: { scrollTo: sectionId },
      });
    }
  };

  const isAdmin = isAuthenticated && (user?.role === 'Administrator' || user?.role === 'Admin');

  return (
    <nav
      ref={navRef}
      aria-label={t('navbar.ariaLabel')}
      className={`navbar navbar-expand-lg fixed-top ${menuActive ? 'menu-open' : ''}`}
    >
      <div className="container">
        <RouterLink to="/" className="navbar-logo-link" onClick={closeMenu}>
          <img
            src="/images/brand_logo_2.png"
            alt={t('navbar.logoAlt')}
            className="navbar-logo"
          />
        </RouterLink>

        <div className="navbar-actions">
          <LanguageDropdown />
          <button
            type="button"
            className={`navbar-toggler ${menuActive ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-expanded={menuActive}
            aria-controls="primary-navigation"
            aria-label={t('navbar.toggleMenu')}
          >
            <span className="navbar-toggler-icon" aria-hidden="true">
              <span className={`line ${menuActive ? 'active' : ''}`}></span>
              <span className={`line ${menuActive ? 'active' : ''}`}></span>
              <span className={`line ${menuActive ? 'active' : ''}`}></span>
            </span>
          </button>
        </div>

        <ul
          id="primary-navigation"
          className={`navbar-nav ${menuActive ? 'active' : ''}`}
        >
          {NAV_SECTIONS.map(({ id, key }) => (
            <li className="nav-item" key={id}>
              <a
                href={id === 'welcome' ? '/' : `/#${id}`}
                className="nav-link"
                onClick={(e) => handleSectionNav(e, id)}
              >
                {t(key)}
              </a>
            </li>
          ))}

          {isAdmin && (
            <li className="nav-item">
              <RouterLink to="/admin" className="nav-link" onClick={closeMenu}>
                {t('navbar.admin_panel')}
              </RouterLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
