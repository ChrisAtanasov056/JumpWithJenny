import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebook, FaTiktok, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="alt-footer">
      <div className="alt-wrap alt-footer__inner">
        <div className="alt-footer__brand">
          <img
            src="/images/brand_logo_2.png"
            alt=""
            aria-hidden="true"
            className="alt-footer__logo"
            width="52"
            height="52"
            loading="lazy"
          />
          <span>
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </span>
        </div>

        <div className="alt-footer__socials">
          <a
            href="https://www.facebook.com/jumpwithjenny"
            className="alt-footer__social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebook aria-hidden="true" />
            <span>Facebook</span>
          </a>
          <a
            href="https://www.tiktok.com/@jump.with.jenny"
            className="alt-footer__social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTiktok aria-hidden="true" />
            <span>TikTok</span>
          </a>
          <a
            href="https://www.instagram.com/jump.with.jenny/"
            className="alt-footer__social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram aria-hidden="true" />
            <span>Instagram</span>
          </a>
        </div>

        <div className="alt-footer__legal">
          <Link to="/data-deletion">{t('footer.dataDeletion')}</Link>
          <a
            href="https://www.iubenda.com/privacy-policy/60706541/cookie-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.cookiePolicy')}
          </a>
          <a
            href="https://www.iubenda.com/privacy-policy/60706541"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.privacyPolicy')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
