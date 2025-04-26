import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AboutMe.scss';

const AboutMe = () => {
  const { t } = useTranslation();
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const shoeRef = useRef(null);  // Create a reference for the kangoo shoe
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    const textNode = textRef.current;
    const imageNode = imageRef.current;
    const shoeNode = shoeRef.current; // Reference for shoe

    if (textNode) observer.observe(textNode);
    if (imageNode) observer.observe(imageNode);
    if (shoeNode) observer.observe(shoeNode); // Observe the shoe as well

    return () => {
      if (textNode) observer.unobserve(textNode);
      if (imageNode) observer.unobserve(imageNode);
      if (shoeNode) observer.unobserve(shoeNode); // Clean up observer for shoe
    };
  }, []);

  return (
    <section id="about" className="about-section">
      <div
        ref={textRef}
        className={`about-text ${isVisible ? 'active' : ''}`}
      >
        <h2>{t('about.title')}</h2>
        <p>{t('about.content')}</p>
      </div>
      <div
        ref={imageRef}
        className={`about-image ${isVisible ? 'active' : ''}`}
      >
        <img src="../../../images/jenny.jpg" alt={t('about.title')} />
      </div>
    </section>
  );
};

export default AboutMe;