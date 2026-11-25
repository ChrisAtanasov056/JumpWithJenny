import React from 'react';
import { useTranslation } from 'react-i18next';
import './AboutMe.scss';

const AboutMe = () => {
  const { t } = useTranslation();

  const rawHighlights = t('altitude.about.highlights', { returnObjects: true });
  const highlights = Array.isArray(rawHighlights) ? rawHighlights : [];

  return (
    <section
      id="about"
      className="alt-section about-section"
      aria-labelledby="about-heading"
    >
      <div className="alt-wrap">
        <h2 id="about-heading" className="alt-section-title">
          {t('about.title')}
        </h2>

        <div className="about-grid">
          <div className="about-portrait-wrap">
            <picture>
              <source srcSet="/images/jenny.webp" type="image/webp" />
              <img
                src="/images/jenny.jpg"
                alt={t('about.title')}
                className="about-portrait"
                loading="lazy"
                decoding="async"
                width={640}
                height={640}
              />
            </picture>
          </div>

          <div className="about-story">
            <p className="about-lead">{t('altitude.about.lead')}</p>

            <div className="about-highlights">
              {highlights.map((item, idx) => (
                <article key={idx} className="about-highlight-card">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
