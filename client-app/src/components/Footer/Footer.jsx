import React from 'react';
import { FaFacebook, FaTiktok, FaInstagram } from 'react-icons/fa';
import './Footer.scss';

const Footer = () => {
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
          <a href="https://www.facebook.com/jumpwithjenny" className="social-btn">
            <FaFacebook className="icon" />
            <span className="label">Facebook</span>
          </a>
          <a href="https://www.tiktok.com/@jump.with.jenny" className="social-btn">
            <FaTiktok className="icon" />
            <span className="label">TikTok</span>
          </a>
          <a href="https://www.instagram.com/jump.with.jenny/" className="social-btn">
            <FaInstagram className="icon" />
            <span className="label">Instagram</span>
          </a>
        </div>
        
        <div className="copyright">
          &copy; {new Date().getFullYear()} Jump With Jenny
        </div>
      </div>
    </footer>
  );
};

export default Footer;