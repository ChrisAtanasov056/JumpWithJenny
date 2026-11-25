import React from 'react';
import { useTranslation } from 'react-i18next';
import './Welcome.scss';

const mp4Source = "/images/main_page.mp4";
const webmSource = "/images/main_page.webm";
const posterSource = "/images/main_page_poster.webp";

const Welcome = () => {
  const { t } = useTranslation();

  const handleGetStarted = (e) => {
    e.preventDefault();
    const target = document.getElementById('schedule');
    if (target) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <section id="welcome" aria-labelledby="welcome-heading">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={posterSource}
        aria-hidden="true"
        className="background-video"
        data-nosnippet
      >
        <source src={webmSource} type="video/webm" />
        <source src={mp4Source} type="video/mp4" />
      </video>

      <div className="overlay" aria-hidden="true"></div>

      <div className="welcome-container">
        <h1 id="welcome-heading">{t('welcomeTitle')}</h1>
        <p>{t('welcomeText')}</p>
        <p>{t('startPrompt')}</p>
        <a
          href="#schedule"
          className="get-started-btn"
          onClick={handleGetStarted}
        >
          {t('startText')}
        </a>
      </div>
    </section>
  );
};

export default Welcome;
