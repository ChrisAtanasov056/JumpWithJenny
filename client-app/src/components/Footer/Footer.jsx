import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebook, FaTiktok, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer-animated">
      <div className="footer-container">
        <div className="jump-animation">
          <div>
            <img src="/images/brand_logo_2.png" alt="Brand Logo" className='kangoo-shoe-img'/>
          </div>
          <div className="shadow"></div>
        </div>
        
        <div className="social-links">
          <a
            href="https://www.facebook.com/jumpwithjenny"
            className="social-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebook className="icon" />
            <span className="label">Facebook</span>
          </a>
          
          <a
            href="https://www.tiktok.com/@jump.with.jenny"
            className="social-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTiktok className="icon" />
            <span className="label">TikTok</span>
          </a>
          
          <a
            href="https://www.instagram.com/jump.with.jenny/"
            className="social-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram className="icon" />
            <span className="label">Instagram</span>
          </a>
        </div>
        
        <div className="footer-links-container">
          <Link to="/data-deletion" className="link">
            {t('footer.dataDeletion')}
          </Link>
          
          <a href="https://www.iubenda.com/privacy-policy/60706541/cookie-policy" className="link" target="_blank" rel="noopener noreferrer">
            {t('footer.cookiePolicy')}
          </a>
          
          <a href="https://www.iubenda.com/privacy-policy/60706541" className="link" target="_blank" rel="noopener noreferrer">
            {t('footer.privacyPolicy')}
          </a>
        </div>

        <div className="copyright">
          &copy; {new Date().getFullYear()} {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;