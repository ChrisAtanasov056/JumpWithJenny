import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPen, FaGoogle } from 'react-icons/fa';
import { GOOGLE_REVIEW_URL, getApprovedReviews } from '../../services/ReviewService';
import ReviewModal from './ReviewModal';
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
  const [reviews, setReviews] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    getApprovedReviews()
      .then((data) => {
        if (!isCancelled) {
          setReviews(Array.isArray(data) ? data : []);
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          const fallbackItems = t('testimonials.items', { returnObjects: true });
          setReviews(Array.isArray(fallbackItems) ? fallbackItems : []);
          setHasLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [t]);

  const visibleTestimonials = showAll
    ? reviews
    : reviews.slice(0, INITIAL_VISIBLE_COUNT);
  const canToggleMore = reviews.length > INITIAL_VISIBLE_COUNT;

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

        {visibleTestimonials.length > 0 ? (
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
                    {item.source === 'Google' && (
                      <span className="balloon-source-badge">
                        <FaGoogle aria-hidden="true" />
                        <span>{t('altitude.reviews.googleBadge')}</span>
                      </span>
                    )}
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
        ) : (
          hasLoaded && (
            <p className="balloons-empty">{t('altitude.reviews.emptyState')}</p>
          )
        )}

        <div className="balloons-actions">
          {canToggleMore && (
            <button
              type="button"
              className="balloons-toggle-btn"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? t('altitude.reviews.showLess') : t('altitude.reviews.showMore')}
            </button>
          )}

          <button
            type="button"
            className="balloons-cta-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <FaPen aria-hidden="true" />
            <span>{t('altitude.reviews.leaveReview')}</span>
          </button>

          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="balloons-google-btn"
          >
            <FaGoogle aria-hidden="true" />
            <span>{t('altitude.reviews.googleReviewCta')}</span>
          </a>
        </div>
      </div>

      <ReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default HappyCustomers;
