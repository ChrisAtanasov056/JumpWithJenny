import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../services/AuthContext';
import useOutsideClick from '../../services/useOutsideClick';
import LanguageDropdown from '../lang/LanguageDropdown.tsx';
import './NavBar.scss';

const NAV_SECTIONS = [
  { id: 'welcome', key: 'navbar.home' },
  { id: 'schedule', key: 'navbar.schedule' },
  { id: 'about', key: 'navbar.about' },
  { id: 'gallery', key: 'navbar.gallery' },
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
      className={`alt-navbar ${menuActive ? 'is-open' : ''}`}
    >
      <div className="alt-navbar__inner">
        <RouterLink to="/" className="alt-navbar__brand" onClick={closeMenu}>
          <img
            src="/images/brand_logo_2.png"
            alt={t('navbar.logoAlt')}
            className="alt-navbar__logo"
          />
          <span className="alt-navbar__title">{t('footer.copyright')}</span>
        </RouterLink>

        <ul
          id="primary-navigation"
          className={`alt-navbar__links ${menuActive ? 'is-open' : ''}`}
        >
          {NAV_SECTIONS.map(({ id, key }) => (
            <li key={id}>
              <a
                href={id === 'welcome' ? '/' : `/#${id}`}
                className="alt-navbar__link"
                onClick={(e) => handleSectionNav(e, id)}
              >
                {t(key)}
              </a>
            </li>
          ))}

          {isAdmin && (
            <li>
              <RouterLink to="/admin" className="alt-navbar__link alt-navbar__link--admin" onClick={closeMenu}>
                {t('navbar.admin_panel')}
              </RouterLink>
            </li>
          )}
        </ul>

        <div className="alt-navbar__actions">
          <LanguageDropdown />
          <button
            type="button"
            className={`alt-navbar__burger ${menuActive ? 'is-open' : ''}`}
            onClick={toggleMenu}
            aria-expanded={menuActive}
            aria-controls="primary-navigation"
            aria-label={t('navbar.toggleMenu')}
          >
            <span className="alt-navbar__burger-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
