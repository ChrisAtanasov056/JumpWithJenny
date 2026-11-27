import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FaTimes, FaStar, FaCheck, FaGoogle, FaCommentDots } from 'react-icons/fa';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';
import { GOOGLE_REVIEW_URL, submitPublicReview } from '../../services/ReviewService';
import './ReviewModal.scss';

const MAX_AUTHOR_LENGTH = 80;
const MIN_AUTHOR_LENGTH = 2;
const MAX_COMMENT_LENGTH = 200;
const MIN_COMMENT_LENGTH = 10;
const URL_REGEX = /(https?:\/\/|www\.)/i;

const KNOWN_ERROR_CODES = new Set([
  'INVALID_AUTHOR_NAME',
  'INVALID_COMMENT',
  'INVALID_RATING',
  'LINKS_NOT_ALLOWED',
]);

const ReviewModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useOutsideClick(modalRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef });

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRating(5);
      setHoverRating(0);
      setAuthorName('');
      setComment('');
      setWebsite('');
      setError('');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const normalizedAuthor = authorName.trim().replace(/\s+/g, ' ');
    if (normalizedAuthor.length < MIN_AUTHOR_LENGTH || normalizedAuthor.length > MAX_AUTHOR_LENGTH) {
      setError(t('reviewModal.errors.INVALID_AUTHOR_NAME'));
      return;
    }

    const normalizedComment = comment.trim().replace(/\s+/g, ' ');
    if (normalizedComment.length < MIN_COMMENT_LENGTH || normalizedComment.length > MAX_COMMENT_LENGTH) {
      setError(t('reviewModal.errors.INVALID_COMMENT'));
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(t('reviewModal.errors.INVALID_RATING'));
      return;
    }

    if (URL_REGEX.test(normalizedAuthor) || URL_REGEX.test(normalizedComment)) {
      setError(t('reviewModal.errors.LINKS_NOT_ALLOWED'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitPublicReview({
        authorName: normalizedAuthor,
        comment: normalizedComment,
        rating,
        website,
      });
      setIsSuccess(true);
    } catch (err) {
      if (err?.response?.status === 429) {
        setError(t('reviewModal.errors.RATE_LIMITED'));
      } else {
        const code = err?.response?.data?.code;
        if (code && KNOWN_ERROR_CODES.has(code)) {
          setError(t(`reviewModal.errors.${code}`));
        } else {
          setError(t('reviewModal.errors.GENERIC'));
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedRating = hoverRating || rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="review-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
        >
          <motion.div
            className="review-modal-sheet"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 48, opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.01 : 0.32,
              ease: [0.32, 0.72, 0, 1],
            }}
          >
            <button
              type="button"
              className="review-modal-close"
              onClick={onClose}
              aria-label={t('reviewModal.close')}
            >
              <FaTimes aria-hidden="true" />
            </button>

            <div className="review-modal-header">
              <div className="review-modal-header__eyebrow">
                <FaCommentDots aria-hidden="true" />
                <span>{t('reviewModal.eyebrow')}</span>
              </div>
              <h2 id="review-modal-title">{t('reviewModal.title')}</h2>
              <p className="review-modal-header__subtitle">{t('reviewModal.subtitle')}</p>
            </div>

            <div className="review-modal-body">
              {isSuccess ? (
                <div className="review-modal-success" role="status">
                  <div className="review-modal-success__icon" aria-hidden="true">
                    <FaCheck />
                  </div>
                  <h3>{t('reviewModal.successTitle')}</h3>
                  <p>{t('reviewModal.successMessage')}</p>

                  <div className="review-modal-google-card">
                    <p>{t('reviewModal.googlePrompt')}</p>
                    <a
                      href={GOOGLE_REVIEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="review-modal-google-btn"
                    >
                      <FaGoogle aria-hidden="true" />
                      <span>{t('reviewModal.googleButton')}</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="review-modal-secondary-btn"
                  >
                    {t('reviewModal.close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="review-modal-field">
                    <span id="review-rating-label" className="review-modal-label">
                      {t('reviewModal.ratingLabel')}
                    </span>
                    <div
                      className="review-modal-stars"
                      role="radiogroup"
                      aria-labelledby="review-rating-label"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isActive = star <= displayedRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            aria-label={t('reviewModal.starAria', { count: star })}
                            className={`review-star-btn${isActive ? ' is-filled' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => {
                              setRating(star);
                              setError('');
                            }}
                          >
                            <FaStar aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="review-modal-field">
                    <label htmlFor="review-author-name" className="review-modal-label">
                      {t('reviewModal.nameLabel')}
                    </label>
                    <input
                      id="review-author-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder={t('reviewModal.namePlaceholder')}
                      value={authorName}
                      onChange={(e) => {
                        setAuthorName(e.target.value);
                        setError('');
                      }}
                      maxLength={MAX_AUTHOR_LENGTH}
                      required
                    />
                  </div>

                  <div className="review-modal-field">
                    <div className="review-modal-label-row">
                      <label htmlFor="review-comment-text" className="review-modal-label">
                        {t('reviewModal.commentLabel')}
                      </label>
                      <span className="review-modal-counter">
                        {t('reviewModal.charCount', {
                          current: comment.length,
                          max: MAX_COMMENT_LENGTH,
                        })}
                      </span>
                    </div>
                    <textarea
                      id="review-comment-text"
                      name="comment"
                      rows={4}
                      placeholder={t('reviewModal.commentPlaceholder')}
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        setError('');
                      }}
                      maxLength={MAX_COMMENT_LENGTH}
                      required
                    />
                  </div>

                  {/* Honeypot field for spam bots */}
                  <div className="review-modal-honeypot" aria-hidden="true">
                    <label htmlFor="review-website-field">Website</label>
                    <input
                      id="review-website-field"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <p className="review-modal-hint">{t('reviewModal.moderationHint')}</p>

                  {error && (
                    <div className="review-modal-error" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="review-modal-primary-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('reviewModal.submitting') : t('reviewModal.submit')}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
