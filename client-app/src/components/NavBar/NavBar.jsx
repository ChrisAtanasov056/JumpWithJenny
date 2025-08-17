import React, { useState } from 'react';
import { Link } from 'react-scroll';
import './NavBar.scss';
import AuthModal from '../Modal/AuthModal';
import ProfileModal from '../Profile/Profile';
import { useAuth } from '../../services/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageDropdown from '../lang/LanguageDropdown.tsx';

const Navbar = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNavActive, setNavActive] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleMenu = () => {
    setMenuActive(!menuActive);
    setNavActive(!isNavActive);
  };

  const toggleModal = () => setModalOpen(!isModalOpen);
  const toggleProfileModal = () => setProfileOpen(!isProfileOpen);
  const handleLoginSuccess = () => setModalOpen(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
  };

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <>
      <nav className={`navbar navbar-expand-lg fixed-top ${menuActive ? 'menu-open' : ''}`}>
        <div className="container">
          <a href="/" className="navbar-logo-link">
            <img
              src="/images/brand_logo_2.png"
              alt="Jump With Jenny Logo"
              className="navbar-logo"
            />
          </a>

          <button
            className={`navbar-toggler ${menuActive ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <div className="navbar-toggler-icon">
              <div className={`line ${menuActive ? 'active' : ''}`}></div>
              <div className={`line ${menuActive ? 'active' : ''}`}></div>
              <div className={`line ${menuActive ? 'active' : ''}`}></div>
            </div>
          </button>

          <div className={`navbar-nav ${isNavActive ? 'active' : ''}`}>
            <li className="nav-item">
              <Link to="welcome" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.home')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="about" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.about')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="gallery" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.gallery')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="schedule" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.schedule')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="faq" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.faq')}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="contacts" className="nav-link" smooth duration={500} onClick={toggleMenu}>
                {t('navbar.contact')}
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                {user?.role === 'Administrator' && (
                  <li className="nav-item">
                    <RouterLink to="/admin" className="nav-link" onClick={toggleMenu}>
                      {t('navbar.admin_panel')}
                    </RouterLink>
                  </li>
                )}
                <li className="nav-item">
                  <button className="profile-area" onClick={toggleProfileModal}>
                    <FontAwesomeIcon icon={faUser} className="profile-icon" />
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button onClick={toggleModal} className="login-btn">
                  {t('navbar.login_register')}
                </button>
              </li>
            )}
          </div>

          <LanguageDropdown changeLanguage={changeLanguage} />
        </div>
      </nav>

      {isModalOpen && (
        <AuthModal
          onClose={toggleModal}
          onLoginSuccess={handleLoginSuccess}
          setModalOpen={setModalOpen}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          onClose={toggleProfileModal}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default Navbar;
