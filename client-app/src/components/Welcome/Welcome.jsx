import React from 'react';
import { Link } from 'react-scroll';
import { useTranslation } from 'react-i18next';
import './Welcome.scss';

const videoSource = "../../images/main_page.mp4"; 

const Welcome = () => {
  const { t } = useTranslation();

  return (
    <section id="welcome">
      <video autoPlay loop muted playsInline className="background-video">
        <source src={videoSource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="overlay"></div>

      <div className="welcome-container">
        <h1>{t('welcomeTitle')}</h1>
        <p>{t('welcomeText')}</p>
        <p>{t('startPrompt')}</p>
        <button className="get-started-btn">
          <Link to="schedule" smooth={true} duration={500}>{t('startText')}</Link>
        </button>
      </div>
    </section>
  );
};

export default Welcome;