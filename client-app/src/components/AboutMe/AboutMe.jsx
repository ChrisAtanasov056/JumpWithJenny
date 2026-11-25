import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AboutMe.scss';

const AboutMe = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
  });

  useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const node = sectionRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const paragraphs = String(t('about.content')).split('\n\n').filter(Boolean);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="about-section"
      aria-labelledby="about-heading"
    >
      <div className="about-container">
        <div className={`about-text ${isVisible ? 'active' : ''}`}>
          <h2 id="about-heading">{t('about.title')}</h2>
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className={`about-image ${isVisible ? 'active' : ''}`}>
          <picture>
            <source srcSet="/images/jenny.webp" type="image/webp" />
            <img
              src="/images/jenny.jpg"
              alt={t('about.title')}
              loading="lazy"
              decoding="async"
              width={1200}
              height={900}
            />
          </picture>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
