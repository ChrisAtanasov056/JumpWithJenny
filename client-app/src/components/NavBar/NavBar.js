import React, { useState } from 'react'; 
import { Link } from 'react-scroll';
import './NavBar.css';
import AuthModal from '../Modal/AuthModal';
import ProfileModal from '../Profile/Profile';
import { useAuth } from '../../services/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNavActive, setNavActive] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  const { isAuthenticated, user ,logout } = useAuth(); // Use authentication context

  const toggleMenu = () => {
    setMenuActive(!menuActive);
    setNavActive(!isNavActive);
  };

  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  const toggleProfileModal = () => {
    setProfileOpen(!isProfileOpen);
  };

  const handleLoginSuccess = (userData) => {
    setModalOpen(false); // Close the login modal on success
  };

  const handleLogout = () => {
    logout(); // Call logout function from auth context
    setProfileOpen(false); // Close profile modal
  };

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container">
        <Link className="navbar-brand" to="/">Jump With Jenny</Link>
        <button 
          className={`navbar-toggler ${menuActive ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <div className="navbar-toggler-icon">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </button>
        <div className={`navbar-nav ${isNavActive ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="welcome" className="nav-link" smooth={true} duration={500} onClick={() => {setNavActive(false); setMenuActive(false);}}>Home</Link>
          </li>
          <li className="nav-item">
            <Link to="about" className="nav-link" smooth={true} duration={500} onClick={() => {setNavActive(false); setMenuActive(false);}}>About Me</Link>
          </li>
          <li className="nav-item">
            <Link to="faq" className="nav-link" smooth={true} duration={500} onClick={() => {setNavActive(false); setMenuActive(false);}}>FAQ</Link>
          </li>
          <li className="nav-item">
            <Link to="schedule" className="nav-link" smooth={true} duration={500} onClick={() => {setNavActive(false); setMenuActive(false);}}>Schedules</Link>
          </li>
          <li className="nav-item">
            <Link to="contacts" className="nav-link" smooth={true} duration={500} onClick={() => {setNavActive(false); setMenuActive(false);}}>Contact</Link>
          </li>
          {!isAuthenticated ? ( 
            <li className="nav-item">
              <button onClick={toggleModal} className="login-btn">Login/Register</button>
            </li>
          ) : (
            <li className="nav-item">
              <button className="profile-area" onClick={toggleProfileModal}>
                <FontAwesomeIcon icon={faUser} className="profile-icon" /> {/* FontAwesome icon for profile */}
              </button>
            </li>
          )}
        </div>
        {isModalOpen && <AuthModal onClose={toggleModal} onLoginSuccess={handleLoginSuccess} setModalOpen={setModalOpen} />}
        {isProfileOpen && <ProfileModal onClose={toggleProfileModal} user={user} onLogout={handleLogout} />}
        <ul className="social-icon ml-3">
          <li>
            <a href="https://facebook.com/groups/950454285546258" target="_blank" rel="noopener noreferrer" className="facebook" aria-label="Facebook"></a>
          </li>
          <li>
            <a href="https://www.tiktok.com/@jump.with.jenny" target="_blank" rel="noopener noreferrer" className="tiktok" aria-label="TikTok"></a>
          </li>
          <li>
            <a href="https://www.instagram.com/jump.with.jenny/" target="_blank" rel="noopener noreferrer" className="instagram" aria-label="Instagram"></a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;