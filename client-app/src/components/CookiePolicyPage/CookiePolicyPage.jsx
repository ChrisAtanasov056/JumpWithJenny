import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCookieBite, FaSlidersH } from 'react-icons/fa';
import { useCookieConsent } from '../../services/CookieConsentContext';
import './CookiePolicyPage.scss';

const STORAGE_ITEMS = [
  {
    key: 'consent',
    name: 'jwj_cookie_consent_v1',
    provider: 'Jump With Jenny',
    categoryKey: 'necessary',
  },
  {
    key: 'language',
    name: 'i18nextLng',
    provider: 'Jump With Jenny',
    categoryKey: 'necessary',
  },
  {
    key: 'bookings',
    name: 'jwj_my_bookings_v1',
    provider: 'Jump With Jenny',
    categoryKey: 'necessary',
  },
  {
    key: 'auth',
    name: 'jwtToken, refreshToken, user',
    provider: 'Jump With Jenny',
    categoryKey: 'necessary',
  },
  {
    key: 'prefs',
    name: 'jwj_booking_prefs_v2',
    provider: 'Jump With Jenny',
    categoryKey: 'functional',
  },
  {
    key: 'maps',
    name: 'Google Maps Embed',
    provider: 'Google LLC',
    categoryKey: 'functional',
  },
  {
    key: 'ga',
    name: '_ga, _ga_P8NNLSQC83',
    provider: 'Google Analytics 4',
    categoryKey: 'analytics',
  },
];

const CookiePolicyPage = () => {
  const { t } = useTranslation();
  const { hasChosen, functionalAllowed, analyticsAllowed, openSettings } = useCookieConsent();

  return (
    <section className="cookie-policy-page" aria-labelledby="cookie-policy-title">
      <Helmet>
        <title>{t('cookies.policy.metaTitle')}</title>
      </Helmet>

      <div className="cookie-policy-card">
        <header className="cookie-policy-header">
          <span className="cookie-policy-eyebrow">
            <FaCookieBite aria-hidden="true" />
            <span>Jump With Jenny</span>
          </span>
          <h1 id="cookie-policy-title">{t('cookies.policy.title')}</h1>
          <p className="cookie-policy-updated">{t('cookies.policy.lastUpdated')}</p>
          <p className="cookie-policy-intro">{t('cookies.policy.intro')}</p>
        </header>

        <div className="cookie-policy-status-box">
          <div className="cookie-policy-status-info">
            <h2>{t('cookies.policy.statusTitle')}</h2>
            <p className="cookie-policy-status-summary">
              {hasChosen
                ? t('cookies.policy.statusSaved')
                : t('cookies.policy.statusDefault')}
            </p>
            <div className="cookie-policy-status-pills">
              <span className="status-pill is-active">
                {t('cookies.categories.necessary.title')}: {t('cookies.policy.enabled')}
              </span>
              <span className={`status-pill ${functionalAllowed ? 'is-active' : 'is-muted'}`}>
                {t('cookies.categories.functional.title')}:{' '}
                {functionalAllowed ? t('cookies.policy.enabled') : t('cookies.policy.disabled')}
              </span>
              <span className={`status-pill ${analyticsAllowed ? 'is-active' : 'is-muted'}`}>
                {t('cookies.categories.analytics.title')}:{' '}
                {analyticsAllowed ? t('cookies.policy.enabled') : t('cookies.policy.disabled')}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="cookie-policy-settings-btn"
            onClick={openSettings}
          >
            <FaSlidersH aria-hidden="true" />
            <span>{t('cookies.policy.changeSettingsBtn')}</span>
          </button>
        </div>

        <div className="cookie-policy-section">
          <h2>{t('cookies.policy.categoriesTitle')}</h2>
          <div className="cookie-policy-categories">
            <article className="cookie-policy-cat-card">
              <h3>{t('cookies.categories.necessary.title')}</h3>
              <p>{t('cookies.categories.necessary.description')}</p>
            </article>
            <article className="cookie-policy-cat-card">
              <h3>{t('cookies.categories.functional.title')}</h3>
              <p>{t('cookies.categories.functional.description')}</p>
            </article>
            <article className="cookie-policy-cat-card">
              <h3>{t('cookies.categories.analytics.title')}</h3>
              <p>{t('cookies.categories.analytics.description')}</p>
            </article>
          </div>
        </div>

        <div className="cookie-policy-section">
          <h2>{t('cookies.policy.tableTitle')}</h2>
          <div className="cookie-policy-table-wrap">
            <table className="cookie-policy-table">
              <thead>
                <tr>
                  <th scope="col">{t('cookies.policy.columns.name')}</th>
                  <th scope="col">{t('cookies.policy.columns.provider')}</th>
                  <th scope="col">{t('cookies.policy.columns.category')}</th>
                  <th scope="col">{t('cookies.policy.columns.type')}</th>
                  <th scope="col">{t('cookies.policy.columns.duration')}</th>
                  <th scope="col">{t('cookies.policy.columns.purpose')}</th>
                </tr>
              </thead>
              <tbody>
                {STORAGE_ITEMS.map((item) => (
                  <tr key={item.key}>
                    <td data-label={t('cookies.policy.columns.name')}>
                      <code>{item.name}</code>
                    </td>
                    <td data-label={t('cookies.policy.columns.provider')}>{item.provider}</td>
                    <td data-label={t('cookies.policy.columns.category')}>
                      {t(`cookies.categories.${item.categoryKey}.title`)}
                    </td>
                    <td data-label={t('cookies.policy.columns.type')}>
                      {t(`cookies.policy.items.${item.key}.type`)}
                    </td>
                    <td data-label={t('cookies.policy.columns.duration')}>
                      {t(`cookies.policy.items.${item.key}.duration`)}
                    </td>
                    <td data-label={t('cookies.policy.columns.purpose')}>
                      {t(`cookies.policy.items.${item.key}.purpose`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cookie-policy-section">
          <h2>{t('cookies.policy.browserTitle')}</h2>
          <p>{t('cookies.policy.browserText')}</p>
        </div>

        <div className="cookie-policy-section">
          <h2>{t('cookies.policy.contactTitle')}</h2>
          <p>
            {t('cookies.policy.contactText')}{' '}
            <a href="mailto:jumpwithjenny.kj@gmail.com" className="cookie-policy-inline-link">
              jumpwithjenny.kj@gmail.com
            </a>
            . {t('cookies.policy.dataDeletionHint')}{' '}
            <Link to="/data-deletion" className="cookie-policy-inline-link">
              {t('footer.dataDeletion')}
            </Link>
            .
          </p>
        </div>

        <div className="cookie-policy-actions">
          <Link to="/" className="cookie-policy-back-btn">
            <FaArrowLeft aria-hidden="true" />
            <span>{t('cookies.policy.backHome')}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CookiePolicyPage;
