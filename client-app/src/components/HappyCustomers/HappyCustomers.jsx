import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './HappyCustomers.scss';

const testimonials = [
  {
    id: 1,
    name: 'Мария Иванова',
    comment: 'Най-доброто място за тренировки. Персонализиран подход към всеки клиент и видими резултати.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Стефка Николова',
    comment: 'Уникално изживяване! Енергията и мотивацията на тренировките са заразителни.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Елена Василева',
    comment: 'С всяка тренировка се чувствам все по-силна и уверена. Благодарение на Жени!',
    rating: 5,
  },
  {
    id: 4,
    name: 'Антония Стоянова',
    comment: 'Програмите са адаптирани към всякакво ниво. Чувствам се част от страхотна общност.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Десислава Георгиева',
    comment: 'Всяка тренировка е истинско удоволствие! Жени, винаги знае как да ни мотивира.',
    rating: 5,
  },
  {
    id: 6,
    name: 'Ива Пенева',
    comment: 'Обичам енергията и положителното настроение на тренировките. Перфектно за разтоварване след работа!',
    rating: 4,
  },
  {
    id: 7,
    name: 'Надежда Тодорова',
    comment: 'След всеки час се чувствам заредена и вдъхновена.',
    rating: 5,
  },
  {
    id: 8,
    name: 'Кристина Алексиева',
    comment: 'От първата тренировка се влюбих в атмосферата и начина, по който Жени работи с нас.',
    rating: 5,
  },
  {
    id: 9,
    name: 'Габриела Илиева',
    comment: 'Страхотна комбинация от забавление и ефективна тренировка! Виждам реална промяна.',
    rating: 5,
  },
  {
    id: 10,
    name: 'Ралица Николова',
    comment: 'Това не е просто тренировка – това е начин на живот!',
    rating: 5,
  },
];

const HappyCustomers = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef({ x: null, y: null });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

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

  const visibleTestimonials = [
    testimonials[(currentIndex + testimonials.length - 1) % testimonials.length],
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
  ];

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
