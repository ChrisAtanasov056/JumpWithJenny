import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';
import './FirstJump.scss';

const FirstJump = () => {
  const { t } = useTranslation();

  const rawSteps = t('altitude.firstJump.steps', { returnObjects: true });
  const steps = Array.isArray(rawSteps) ? rawSteps : [];

  const rawBringItems = t('altitude.firstJump.bringItems', { returnObjects: true });
  const bringItems = Array.isArray(rawBringItems) ? rawBringItems : [];

  const scrollToSchedule = (event) => {
    event?.preventDefault();
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
    <section
      id="first-jump"
      className="alt-section first-jump-section"
      aria-labelledby="first-jump-heading"
    >
      <div className="alt-wrap">
        <header className="first-jump-header">
          <h2 id="first-jump-heading" className="alt-section-title">
            {t('altitude.firstJump.title')}
          </h2>
          <p className="first-jump-subtitle">
            {t('altitude.firstJump.subtitle')}
          </p>
        </header>

        <div className="first-jump-grid">
          <div className="first-jump-timeline">
            <h3 className="first-jump-col-title">
              {t('altitude.firstJump.stepsTitle')}
            </h3>
            <ol className="first-jump-steps">
              {steps.map((step, idx) => (
                <li key={idx} className="first-jump-step">
                  <span className="first-jump-step__num" aria-hidden="true">
                    {idx + 1}
                  </span>
                  <div className="first-jump-step__card">
                    <h4>{step.title}</h4>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="first-jump-checklist" aria-labelledby="first-jump-bring-heading">
            <h3 id="first-jump-bring-heading" className="first-jump-checklist__title">
              {t('altitude.firstJump.bringTitle')}
            </h3>

            <ul className="first-jump-bring-list">
              {bringItems.map((item, idx) => (
                <li key={idx} className="first-jump-bring-item">
                  <span className="first-jump-bring-item__icon" aria-hidden="true">
                    <FaCheck />
                  </span>
                  <div className="first-jump-bring-item__body">
                    <div className="first-jump-bring-item__top">
                      <strong>{item.title}</strong>
                      {item.required ? (
                        <span className="first-jump-bring-item__badge">
                          {t('altitude.firstJump.requiredBadge')}
                        </span>
                      ) : null}
                    </div>
                    <p>{item.note}</p>
                  </div>
                </li>
              ))}
            </ul>

            <a
              href="#schedule"
              className="alt-btn first-jump-cta"
              onClick={scrollToSchedule}
            >
              {t('altitude.firstJump.cta')}
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default FirstJump;
