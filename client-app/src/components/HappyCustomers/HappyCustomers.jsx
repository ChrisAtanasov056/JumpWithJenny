import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './HappyCustomers.scss';

const BALLOON_TINTS = [
  'rgba(255, 210, 63, 0.25)',
  'rgba(255, 159, 178, 0.25)',
  'rgba(155, 231, 196, 0.25)',
  'rgba(185, 167, 255, 0.25)',
  'rgba(255, 178, 122, 0.25)',
];

const BALLOON_OFFSETS = [0, 28, 8, 34, 12];
const INITIAL_VISIBLE_COUNT = 5;

const HappyCustomers = () => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const translatedItems = t('testimonials.items', { returnObjects: true });
  const testimonials =
    Array.isArray(translatedItems) && translatedItems.length > 0 ? translatedItems : [];

  if (testimonials.length === 0) return null;

  const visibleTestimonials = showAll
    ? testimonials
    : testimonials.slice(0, INITIAL_VISIBLE_COUNT);
  const canToggleMore = testimonials.length > INITIAL_VISIBLE_COUNT;

  return (
    <section
      id="customers"
      className="alt-section reviews-section"
      aria-labelledby="testimonials-heading"
    >
      <div className="alt-wrap">
        <h2 id="testimonials-heading" className="alt-section-title">
          {t('testimonials.title')}
        </h2>

        <div className="balloons-grid">
          {visibleTestimonials.map((item, idx) => {
            const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));
            const starsText = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            const tint = BALLOON_TINTS[idx % BALLOON_TINTS.length];
            const offset = BALLOON_OFFSETS[idx % BALLOON_OFFSETS.length];

            return (
              <article
                key={item.id || idx}
                className="balloon-item"
                style={{
                  '--k': idx,
                  '--tint': tint,
                  '--by': `${offset}px`,
                }}
              >
                <div className="balloon-body">
                  <div
                    className="balloon-stars"
                    aria-label={t('testimonials.ratingLabel', { rating })}
                  >
                    {starsText}
                  </div>
                  <p className="balloon-quote">„{item.comment}“</p>
                  <b className="balloon-author">{item.name}</b>
                </div>
                <div className="balloon-knot" aria-hidden="true" />
                <svg
                  className="balloon-string"
                  viewBox="0 0 24 70"
                  width="24"
                  height="68"
                  aria-hidden="true"
                >
                  <path
                    d="M12 0 Q 20 18 11 36 T 13 70"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.55)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </article>
            );
          })}
        </div>

        {canToggleMore && (
          <div className="balloons-actions">
            <button
              type="button"
              className="balloons-toggle-btn"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? t('altitude.reviews.showLess') : t('altitude.reviews.showMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HappyCustomers;
