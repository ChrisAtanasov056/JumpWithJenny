import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './HappyCustomers.scss';

const HappyCustomers = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef({ x: null, y: null });

  const translatedItems = t('testimonials.items', { returnObjects: true });
  const testimonials = Array.isArray(translatedItems) && translatedItems.length > 0 ? translatedItems : [];

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const nextSlide = useCallback(() => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const { x: startX, y: startY } = touchStartRef.current;
    if (startX === null || startY === null) return;

    const touch = e.changedTouches[0];
    const diffX = startX - touch.clientX;
    const diffY = startY - touch.clientY;
    const swipeThreshold = 50;

    if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartRef.current = { x: null, y: null };
  };

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, nextSlide]);

  const safeIndex = testimonials.length > 0 ? currentIndex % testimonials.length : 0;
  const visibleTestimonials = testimonials.length > 0
    ? [
        testimonials[(safeIndex + testimonials.length - 1) % testimonials.length],
        testimonials[safeIndex],
        testimonials[(safeIndex + 1) % testimonials.length],
      ]
    : [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section
      id="customers"
      className="happy-customers"
      aria-labelledby="customers-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <h2 id="customers-title" className="section-title">
        {t('testimonials.title')}
      </h2>

      <div
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="arrow-btn left"
          aria-label={t('testimonials.prevSlide')}
          onClick={prevSlide}
        >
          <FaChevronLeft aria-hidden="true" />
        </button>

        <div className="testimonials-list">
          {visibleTestimonials.map((testimonial, index) => (
            <article
              key={testimonial.id}
              className={`testimonial-card ${index === 1 ? 'active' : 'inactive'}`}
              aria-hidden={index !== 1}
            >
              <p className="testimonial-comment">&ldquo;{testimonial.comment}&rdquo;</p>

              <div className="testimonial-author">
                <span className="author-name">{testimonial.name}</span>
                <div
                  className="star-rating"
                  aria-label={t('testimonials.ratingLabel', { rating: testimonial.rating })}
                >
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      aria-hidden="true"
                      className={i < testimonial.rating ? 'star filled' : 'star'}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="arrow-btn right"
          aria-label={t('testimonials.nextSlide')}
          onClick={nextSlide}
        >
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="carousel-dots">
        {testimonials.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
            aria-label={t('testimonials.goToSlide', { index: i + 1 })}
            aria-current={i === currentIndex ? 'true' : undefined}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </section>
  );
};

export default HappyCustomers;
