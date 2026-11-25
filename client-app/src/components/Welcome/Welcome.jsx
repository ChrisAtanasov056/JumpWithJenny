import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseWorkoutDate } from '../../utils/workoutDate';
import { formatShortDate } from '../../hooks/useScheduleWorkouts';
import './Welcome.scss';

const mp4Source = '/images/main_page.mp4';
const webmSource = '/images/main_page.webm';
const posterSource = '/images/main_page_poster.webp';

const pad2 = (num) => String(num).padStart(2, '0');

const SplitAnimatedHeading = ({ line1, line2 }) => {
  let index = 0;
  const renderLine = (text) =>
    String(text)
      .split(' ')
      .map((word, wordIdx, arr) => (
        <React.Fragment key={`${word}-${wordIdx}`}>
          <span className="welcome-word">
            {Array.from(word).map((char) => {
              const currentIdx = index;
              index += 1;
              return (
                <span
                  key={currentIdx}
                  className="ch"
                  style={{ '--i': currentIdx }}
                >
                  {char}
                </span>
              );
            })}
          </span>
          {wordIdx < arr.length - 1 ? ' ' : null}
        </React.Fragment>
      ));

  return (
    <h1 id="welcome-heading" className="welcome-heading" aria-label={`${line1} ${line2}`}>
      <span aria-hidden="true">
        {renderLine(line1)}
        <br />
        {renderLine(line2)}
      </span>
    </h1>
  );
};

const Welcome = ({ workouts = [], loadingWorkouts = false }) => {
  const { t, i18n } = useTranslation();
  const videoRef = useRef(null);
  const ctaRef = useRef(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (videoRef.current) {
        videoRef.current.style.transform = 'scale(1.07)';
      }
      return;
    }

    let rafId = null;
    const updateParallax = () => {
      rafId = null;
      if (!videoRef.current) return;
      const shift = Math.min(window.scrollY * 0.16, 110);
      videoRef.current.style.transform = `translateY(${shift}px) scale(1.07)`;
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const handleCtaPointerMove = (event) => {
    if (event.pointerType !== 'mouse') return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !ctaRef.current) return;

    const rect = ctaRef.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < 110) {
      ctaRef.current.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`;
    }
  };

  const handleCtaPointerLeave = () => {
    if (ctaRef.current) {
      ctaRef.current.style.translate = '0 0';
    }
  };

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

  const nextWorkout = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return null;
    const now = new Date(nowTick);
    const future = workouts.filter((w) => {
      const parsed = parseWorkoutDate(w.Date);
      return parsed && parsed > now;
    });
    return (
      future.find((w) => (w.AvailableSpots ?? 0) > 0 && w.Status?.toLowerCase() === 'available') ||
      future[0] ||
      null
    );
  }, [workouts, nowTick]);

  const countdownText = useMemo(() => {
    if (!nextWorkout) return '';
    const targetDate = parseWorkoutDate(nextWorkout.Date);
    if (!targetDate) return '';
    const diffMs = Math.max(0, targetDate.getTime() - nowTick);
    const totalMin = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const minutes = totalMin % 60;
    return t('altitude.countdownPrefix', {
      days,
      hours: pad2(hours),
      minutes: pad2(minutes),
    });
  }, [nextWorkout, nowTick, t]);

  const marqueeItems = [
    t('altitude.marquee.item1'),
    t('altitude.marquee.item2'),
    t('altitude.marquee.item3'),
    t('altitude.marquee.item4'),
  ];

  const availableSpots = nextWorkout?.AvailableSpots ?? 0;
  const translatedDay = nextWorkout?.Day
    ? t(`days.${nextWorkout.Day.toLowerCase()}`, { defaultValue: nextWorkout.Day })
    : '';
  const shortDate = nextWorkout?.Date ? formatShortDate(nextWorkout.Date, activeLang) : '';

  return (
    <section id="welcome" className="welcome-hero" aria-labelledby="welcome-heading">
      <div className="welcome-video-wrap" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterSource}
          className="welcome-video"
          data-nosnippet
        >
          <source src={webmSource} type="video/webm" />
          <source src={mp4Source} type="video/mp4" />
        </video>
        <div className="welcome-video-shade" />
        <div className="welcome-video-tint" />
      </div>

      <div className="alt-wrap welcome-shell">
        <div className="welcome-copy">
          <div className="welcome-loc-badge">
            <span>{t('altitude.heroBadgeSport')}</span>
            <span>{t('altitude.heroBadgeCity')}</span>
          </div>

          <SplitAnimatedHeading
            line1={t('altitude.heroHeadingLine1')}
            line2={t('altitude.heroHeadingLine2')}
          />

          <p className="welcome-lead">{t('welcomeText')}</p>

          <div className="welcome-actions">
            <a
              ref={ctaRef}
              href="#schedule"
              className="alt-btn welcome-cta"
              onClick={scrollToSchedule}
              onPointerMove={handleCtaPointerMove}
              onPointerLeave={handleCtaPointerLeave}
            >
              {t('altitude.heroCta')}
            </a>

            <button
              type="button"
              className="welcome-next-chip"
              onClick={scrollToSchedule}
              aria-label={t('altitude.nextWorkoutLabel')}
            >
              <span className="welcome-pulse-dot" aria-hidden="true" />
              <span className="welcome-next-chip__body">
                {nextWorkout ? (
                  <>
                    <strong>
                      {translatedDay} ({shortDate}), {nextWorkout.Time}
                    </strong>
                    <span className="welcome-next-chip__meta">{countdownText}</span>
                    <span className="welcome-next-chip__meta">
                      {availableSpots === 1
                        ? t('altitude.spotsAvailableSingular', { count: availableSpots })
                        : t('altitude.spotsAvailablePlural', { count: availableSpots })}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{t('altitude.nextWorkoutLabel')}</strong>
                    <span className="welcome-next-chip__meta">
                      {loadingWorkouts ? t('schedule.loading') : t('altitude.noUpcomingChip')}
                    </span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="welcome-marquee" aria-hidden="true">
        <div className="welcome-marquee__track">
          {[0, 1].map((dup) => (
            <div key={dup} className="welcome-marquee__group">
              {marqueeItems.map((item, idx) => (
                <span key={`${dup}-${idx}`} className="welcome-marquee__item">
                  <span>{item}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffd23f" />
                  </svg>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Welcome;
