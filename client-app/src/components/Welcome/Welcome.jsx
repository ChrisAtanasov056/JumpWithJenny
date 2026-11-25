import React from 'react';
import { useTranslation } from 'react-i18next';
import './Welcome.scss';

const videoSource = "/images/main_page.mp4";

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
        aria-hidden="true"
        className="background-video"
        data-nosnippet
      >
        <source src={videoSource} type="video/mp4" />
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
