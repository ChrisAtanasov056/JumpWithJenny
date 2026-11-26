import React from 'react';
import { useTranslation } from 'react-i18next';
import './WorkoutMetrics.scss';

const WorkoutMetrics = () => {
  const { t } = useTranslation();

  const rawItems = t('altitude.workoutMetrics.items', { returnObjects: true });
  const items = Array.isArray(rawItems) ? rawItems : [];

  return (
    <section
      id="workout-info"
      className="alt-section workout-metrics-section"
      aria-labelledby="workout-metrics-heading"
    >
      <div className="alt-wrap">
        <header className="workout-metrics-header">
          <h2 id="workout-metrics-heading" className="alt-section-title">
            {t('altitude.workoutMetrics.title')}
          </h2>
          <p className="workout-metrics-subtitle">
            {t('altitude.workoutMetrics.subtitle')}
          </p>
        </header>

        <ul className="workout-metrics-bar">
          {items.map((item, idx) => (
            <li key={idx} className="workout-metric">
              <span className="workout-metric__value">{item.value}</span>
              <h3 className="workout-metric__label">{item.label}</h3>
              <p className="workout-metric__desc">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WorkoutMetrics;
