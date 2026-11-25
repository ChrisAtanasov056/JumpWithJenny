import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FaStar,
  FaChevronDown,
  FaTimes,
  FaCheck,
  FaClock,
  FaShoePrints,
  FaArrowLeft,
  FaPalette,
} from 'react-icons/fa';
import axios from '../../api/axius';
import { parseWorkoutDate, formatWorkoutDateBg } from '../../utils/workoutDate';
import {
  CONCEPTS,
  COPY,
  SHOE_SIZES,
  createFallbackWorkouts,
} from './demoData';
import DemoBookingModal from './DemoBookingModal';
import './ConceptsDemo.scss';

const HERO_WEBM = '/images/main_page.webm';
const HERO_MP4 = '/images/main_page.mp4';
const HERO_POSTER = '/images/main_page_poster.webp';

const CONCEPT_PARAM_MAP = {
  '1': 'pulse',
  pulse: 'pulse',
  '2': 'coral',
  coral: 'coral',
  '3': 'amber',
  amber: 'amber',
  '4': 'nocturne',
  nocturne: 'nocturne',
};

const getShoeAvailabilityCounts = (workout) => {
  const counts = { S: 0, M: 0, L: 0, XL: 0 };
  if (!workout?.WorkoutShoes) return counts;

  workout.WorkoutShoes.forEach((ws) => {
    if (!ws.IsTaken && ws.Shoe) {
      const match = SHOE_SIZES.find((s) => s.code === ws.Shoe.Size);
      if (match) counts[match.key] += 1;
    }
  });
  return counts;
};

const MagneticButton = ({ children, className, onClick, enabled = true, type = 'button' }) => {
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canHoverFine =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

  const isMagnetic = enabled && canHoverFine && !prefersReducedMotion;

  const handleMouseMove = (e) => {
    if (!isMagnetic) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    setOffset({ x: dx, y: dy });
  };

  const handleMouseLeave = () => {
    if (offset.x !== 0 || offset.y !== 0) {
      setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={isMagnetic ? { x: offset.x, y: offset.y } : undefined}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
    >
      {children}
    </motion.button>
  );
};

const ConceptsDemo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const initialParam = searchParams.get('concept');
  const [activeConcept, setActiveConcept] = useState(
    () => CONCEPT_PARAM_MAP[initialParam] || 'pulse'
  );
  const [lang, setLang] = useState('bg');
  const [workouts, setWorkouts] = useState(() => createFallbackWorkouts());
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [demoBookings, setDemoBookings] = useState({});
  const [modalWorkoutId, setModalWorkoutId] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [cancelPreviewDone, setCancelPreviewDone] = useState(false);
  const [showPaletteCard, setShowPaletteCard] = useState(false);
  const galleryTrackRef = useRef(null);

  const copy = COPY[lang];
  const currentConceptMeta = useMemo(
    () => CONCEPTS.find((c) => c.id === activeConcept) || CONCEPTS[0],
    [activeConcept]
  );

  useEffect(() => {
    const param = searchParams.get('concept');
    const mapped = CONCEPT_PARAM_MAP[param];
    if (mapped && mapped !== activeConcept) {
      setActiveConcept(mapped);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let isCancelled = false;
    axios
      .get('/api/Schedule', { timeout: 1800 })
      .then((res) => {
        if (isCancelled || !Array.isArray(res.data)) return;
        const now = new Date();
        const upcoming = res.data
          .filter((w) => {
            const parsed = parseWorkoutDate(w.Date);
            return parsed && parsed > now;
          })
          .sort((a, b) => parseWorkoutDate(a.Date) - parseWorkoutDate(b.Date));

        if (upcoming.length > 0) {
          setWorkouts(upcoming);
          setIsLiveSource(true);
        }
      })
      .catch(() => {
        // Keep realistic fallback workouts when API is offline
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSelectConcept = useCallback(
    (conceptId) => {
      setActiveConcept(conceptId);
      const found = CONCEPTS.find((c) => c.id === conceptId);
      setSearchParams({ concept: found?.number || '1' }, { replace: true });
    },
    [setSearchParams]
  );

  const availableDays = useMemo(() => {
    const seen = new Set();
    workouts.forEach((w) => {
      if (w.Day) seen.add(w.Day);
    });
    return Array.from(seen);
  }, [workouts]);

  const filteredWorkouts = useMemo(() => {
    if (selectedDay === 'ALL') return workouts;
    return workouts.filter((w) => w.Day === selectedDay);
  }, [workouts, selectedDay]);

  const nextAvailableWorkout = useMemo(
    () =>
      workouts.find(
        (w) => (w.AvailableSpots ?? 0) > 0 && w.Status?.toLowerCase() === 'available'
      ) || workouts[0],
    [workouts]
  );

  const activeModalWorkout = useMemo(
    () => workouts.find((w) => w.Id === modalWorkoutId) || null,
    [workouts, modalWorkoutId]
  );

  const scrollToSection = useCallback(
    (sectionId) => {
      const target = document.getElementById(sectionId);
      if (!target) return;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    },
    [prefersReducedMotion]
  );

  const handleDemoBookSuccess = useCallback((workoutId, bookingInfo) => {
    setDemoBookings((prev) => ({
      ...prev,
      [workoutId]: bookingInfo,
    }));

    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.Id !== workoutId) return w;
        const nextAvail = Math.max(0, (w.AvailableSpots ?? 1) - 1);
        const nextTaken = (w.TakenSpots ?? 0) + 1;
        let shoeTakenUpdated = false;
        const targetShoeCode = SHOE_SIZES.find((s) => s.key === bookingInfo.shoeSize)?.code;

        const nextShoes = Array.isArray(w.WorkoutShoes)
          ? w.WorkoutShoes.map((ws) => {
              if (
                !bookingInfo.usesOwnShoes &&
                !shoeTakenUpdated &&
                !ws.IsTaken &&
                ws.Shoe?.Size === targetShoeCode
              ) {
                shoeTakenUpdated = true;
                return { ...ws, IsTaken: true };
              }
              return ws;
            })
          : w.WorkoutShoes;

        return {
          ...w,
          AvailableSpots: nextAvail,
          TakenSpots: nextTaken,
          Status: nextAvail === 0 ? 'Booked' : w.Status,
          WorkoutShoes: nextShoes,
        };
      })
    );
  }, []);

  const handleDemoCancelBooking = useCallback(
    (workoutId) => {
      const existing = demoBookings[workoutId];
      setDemoBookings((prev) => {
        const next = { ...prev };
        delete next[workoutId];
        return next;
      });

      setWorkouts((prev) =>
        prev.map((w) => {
          if (w.Id !== workoutId) return w;
          const nextAvail = (w.AvailableSpots ?? 0) + 1;
          const nextTaken = Math.max(0, (w.TakenSpots ?? 1) - 1);
          let shoeReleased = false;
          const targetShoeCode = SHOE_SIZES.find((s) => s.key === existing?.shoeSize)?.code;

          const nextShoes = Array.isArray(w.WorkoutShoes)
            ? w.WorkoutShoes.map((ws) => {
                if (
                  existing &&
                  !existing.usesOwnShoes &&
                  !shoeReleased &&
                  ws.IsTaken &&
                  ws.Shoe?.Size === targetShoeCode
                ) {
                  shoeReleased = true;
                  return { ...ws, IsTaken: false };
                }
                return ws;
              })
            : w.WorkoutShoes;

          return {
            ...w,
            AvailableSpots: nextAvail,
            TakenSpots: nextTaken,
            Status: 'Available',
            WorkoutShoes: nextShoes,
          };
        })
      );
    },
    [demoBookings]
  );

  const heroTitle =
    activeConcept === 'coral'
      ? copy.hero.coralTitle
      : activeConcept === 'amber'
        ? copy.hero.amberTitle
        : activeConcept === 'nocturne'
          ? copy.hero.nocturneTitle
          : copy.hero.pulseTitle;

  const heroLead =
    activeConcept === 'coral'
      ? copy.hero.coralLead
      : activeConcept === 'amber'
        ? copy.hero.amberLead
        : activeConcept === 'nocturne'
          ? copy.hero.nocturneLead
          : copy.hero.pulseLead;

  const renderHeader = () => (
    <header className="demo-header">
      <div className="demo-container header-inner">
        <a
          href="#demo-hero"
          className="brand-mark"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('demo-hero');
          }}
        >
          <img src="/brand_logo.png" alt="Jump With Jenny" className="brand-logo-img" />
          <span className="brand-name">{copy.brand}</span>
        </a>

        <nav className="header-nav" aria-label={copy.nav.schedule}>
          <button type="button" onClick={() => scrollToSection('demo-schedule')}>
            {copy.nav.schedule}
          </button>
          <button type="button" onClick={() => scrollToSection('demo-about')}>
            {copy.nav.about}
          </button>
          <button type="button" onClick={() => scrollToSection('demo-gallery')}>
            {copy.nav.gallery}
          </button>
          <button type="button" onClick={() => scrollToSection('demo-faq')}>
            {copy.nav.faq}
          </button>
          <button type="button" onClick={() => scrollToSection('demo-cancel-preview')}>
            {copy.nav.cancelPreview}
          </button>
        </nav>

        <div className="header-actions">
          <MagneticButton
            className="header-cta-btn"
            onClick={() => scrollToSection('demo-schedule')}
          >
            {copy.nav.bookCta}
          </MagneticButton>
        </div>
      </div>
    </header>
  );

  const renderHero = () => {
    const nextDayName = nextAvailableWorkout?.Day
      ? copy.schedule.days[nextAvailableWorkout.Day] || nextAvailableWorkout.Day
      : '';

    return (
      <section id="demo-hero" className="hero-studio">
        <div className="hero-studio-media">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            aria-hidden="true"
            className="hero-bg-video"
          >
            <source src={HERO_WEBM} type="video/webm" />
            <source src={HERO_MP4} type="video/mp4" />
          </video>
          <div className="hero-studio-scrim" aria-hidden="true" />
          <div className="hero-ambient-glow" aria-hidden="true" />
        </div>

        <div className="demo-container hero-studio-content">
          <motion.div
            key={activeConcept}
            className="hero-studio-stack"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="hero-status-pill">
              <span className="pulse-dot" aria-hidden="true" />
              <span>{copy.locationBadge}</span>
            </div>

            <h1 className="hero-display-title">{heroTitle}</h1>
            <p className="hero-lead">{heroLead}</p>

            <div className="hero-cta-row">
              <MagneticButton
                className="cta-primary"
                onClick={() => scrollToSection('demo-schedule')}
              >
                {copy.hero.ctaPrimary}
              </MagneticButton>

              {nextAvailableWorkout && (
                <button
                  type="button"
                  className="hero-next-slot-card"
                  onClick={() => setModalWorkoutId(nextAvailableWorkout.Id)}
                >
                  <span className="next-slot-label">{copy.hero.nextClassLabel}</span>
                  <strong className="tabular-nums">
                    {nextDayName}, {nextAvailableWorkout.Time} ·{' '}
                    {nextAvailableWorkout.AvailableSpots}{' '}
                    {nextAvailableWorkout.AvailableSpots === 1
                      ? copy.schedule.spotLeftSingular
                      : copy.schedule.spotsLeft}
                  </strong>
                </button>
              )}
            </div>
          </motion.div>
        </div>
        <div className="studio-spring-arc" aria-hidden="true" />
      </section>
    );
  };

  const renderCapacityIndicator = (taken, total) => {
    const segments = 12;
    const filledSegments = Math.round((taken / total) * segments);
    const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

    if (activeConcept === 'amber') {
      return (
        <div className="amber-progress-track" aria-hidden="true">
          <div className="amber-progress-fill" style={{ width: `${pct}%` }}>
            <span className="amber-end-dot" />
          </div>
        </div>
      );
    }

    if (activeConcept === 'nocturne') {
      return (
        <div className="nocturne-progress-track" aria-hidden="true">
          <div className="nocturne-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      );
    }

    return (
      <div className={`led-meter ${activeConcept === 'coral' ? 'is-soft-pills' : ''}`} aria-hidden="true">
        {Array.from({ length: segments }).map((_, idx) => (
          <span
            key={idx}
            className={`led-segment ${idx < filledSegments ? 'is-occupied' : 'is-open'}`}
          />
        ))}
      </div>
    );
  };

  const renderScheduleCard = (workout) => {
    const counts = getShoeAvailabilityCounts(workout);
    const total =
      workout.TotalSpots || (workout.TakenSpots ?? 0) + (workout.AvailableSpots ?? 0) || 12;
    const taken = workout.TakenSpots ?? Math.max(0, total - (workout.AvailableSpots ?? 0));
    const available = workout.AvailableSpots ?? 0;
    const isBookedByMe = Boolean(demoBookings[workout.Id]);
    const isFull = available <= 0 || workout.Status?.toLowerCase() === 'booked';
    const canOpen = !isFull || isBookedByMe;
    const dayName = copy.schedule.days[workout.Day] || workout.Day;
    const dateLabel = formatWorkoutDateBg(workout.Date);

    return (
      <article
        key={workout.Id}
        className={`bento-slot-card ${isFull && !isBookedByMe ? 'is-full' : ''} ${isBookedByMe ? 'is-registered' : ''}`}
      >
        <div className="slot-card-top">
          <div>
            <span className="slot-day-badge">{dayName}</span>
            <h3 className="slot-time-heading tabular-nums">{workout.Time}</h3>
            <span className="slot-date-sub tabular-nums">{dateLabel}</span>
          </div>

          <span
            className={`slot-status-pill ${isBookedByMe ? 'is-mine' : isFull ? 'is-full' : 'is-open'}`}
          >
            {isBookedByMe
              ? copy.schedule.registered
              : isFull
                ? copy.schedule.full
                : `${available} ${available === 1 ? copy.schedule.spotLeftSingular : copy.schedule.spotsLeft}`}
          </span>
        </div>

        {renderCapacityIndicator(taken, total)}

        <div className="slot-shoes-block">
          <span className="slot-shoes-title">
            <FaShoePrints aria-hidden="true" /> {copy.schedule.shoesAvailableLabel}
          </span>
          <div className="shoe-chips-row">
            {SHOE_SIZES.map((sz) => (
              <span
                key={sz.key}
                className={`shoe-mini-chip ${counts[sz.key] > 0 ? 'has-stock' : 'is-empty'}`}
              >
                {sz.key} <strong className="tabular-nums">{counts[sz.key]}</strong>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canOpen}
          className="slot-action-btn"
          onClick={() => canOpen && setModalWorkoutId(workout.Id)}
        >
          {isBookedByMe
            ? copy.schedule.manageButton
            : isFull
              ? copy.schedule.full
              : copy.schedule.bookButton}
        </button>
      </article>
    );
  };

  const renderSchedule = () => (
    <section
      id="demo-schedule"
      className="demo-section schedule-section"
      aria-labelledby="schedule-heading"
    >
      <div className="demo-container">
        <div className="section-header-row">
          <div>
            <h2 id="schedule-heading" className="section-title">
              {copy.schedule.title}
            </h2>
            <p className="section-subtitle">{copy.schedule.subtitle}</p>
          </div>
          <span className="source-indicator-pill">
            {isLiveSource ? copy.schedule.demoSourceLive : copy.schedule.demoSourcePreview}
          </span>
        </div>

        <div className="day-filter-bar" role="tablist" aria-label={copy.schedule.title}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedDay === 'ALL'}
            className={`day-pill ${selectedDay === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedDay('ALL')}
          >
            <span className="pill-label">{copy.schedule.allDays}</span>
          </button>

          {availableDays.map((day) => {
            const active = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={active}
                className={`day-pill ${active ? 'is-active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                <span className="pill-label">{copy.schedule.shortDays[day] || day}</span>
              </button>
            );
          })}
        </div>

        <div className="schedule-grid">
          {filteredWorkouts.map((workout) => renderScheduleCard(workout))}
        </div>
      </div>
    </section>
  );

  const renderAbout = () => (
    <section
      id="demo-about"
      className="demo-section about-section"
      aria-labelledby="about-heading"
    >
      <div className="demo-container">
        <div className="about-layout-grid">
          <div className="about-portrait-col">
            <div className="portrait-frame">
              <img
                src="/images/jenny.webp"
                alt="Жени — Kangoo Jumps"
                loading="lazy"
                decoding="async"
              />
              <div className="portrait-badge">{copy.instructorBadge}</div>
            </div>
          </div>

          <div className="about-story-col">
            <h2 id="about-heading" className="section-title">
              {copy.about.title}
            </h2>
            <p className="about-lead">{copy.about.lead}</p>
            <blockquote className="about-quote">{copy.about.quote}</blockquote>

            <div className="pillars-grid">
              {copy.about.pillars.map((pillar) => (
                <div key={pillar.title} className="pillar-card">
                  <span className="pillar-value tabular-nums">{pillar.value}</span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderGallery = () => (
    <section
      id="demo-gallery"
      className="demo-section gallery-section"
      aria-labelledby="gallery-heading"
    >
      <div className="demo-container">
        <div className="section-header-row">
          <div>
            <h2 id="gallery-heading" className="section-title">
              {copy.gallery.title}
            </h2>
            <p className="section-subtitle">{copy.gallery.subtitle}</p>
          </div>
        </div>

        <div ref={galleryTrackRef} className="gallery-layout">
          {copy.gallery.items.map((item, idx) => (
            <button
              key={item.src}
              type="button"
              className={`gallery-tile tile-${idx}`}
              onClick={() => setLightboxItem(item)}
            >
              <img src={item.src} alt={item.caption} loading="lazy" decoding="async" />
              <span className="gallery-caption">{item.caption}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  const renderReviews = () => (
    <section
      id="demo-reviews"
      className="demo-section reviews-section"
      aria-labelledby="reviews-heading"
    >
      <div className="demo-container">
        <div className="section-header-row">
          <div>
            <h2 id="reviews-heading" className="section-title">
              {copy.reviews.title}
            </h2>
            <p className="section-subtitle">{copy.reviews.subtitle}</p>
          </div>
        </div>

        <div className="reviews-grid">
          {copy.reviews.items.map((rev) => (
            <article key={rev.name} className="review-card">
              <div className="review-stars" aria-label={`${rev.rating} / 5`}>
                {Array.from({ length: rev.rating }).map((_, sIdx) => (
                  <FaStar key={sIdx} aria-hidden="true" />
                ))}
              </div>
              <p className="review-text">„{rev.comment}“</p>
              <div className="review-author">
                <strong>{rev.name}</strong>
                <span>{rev.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  const renderFaqAndCancel = () => (
    <section
      id="demo-faq"
      className="demo-section faq-cancel-section"
      aria-labelledby="faq-heading"
    >
      <div className="demo-container faq-cancel-grid">
        <div className="faq-column">
          <h2 id="faq-heading" className="section-title">
            {copy.faq.title}
          </h2>
          <div className="faq-accordion-list">
            {copy.faq.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <FaChevronDown className="faq-chevron" aria-hidden="true" />
                  </button>
                  <div className="faq-answer-wrap">
                    <div className="faq-answer-inner">
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="demo-cancel-preview" className="cancel-preview-column">
          <h2 className="section-title">{copy.cancelPreview.sectionTitle}</h2>
          <p className="section-subtitle">{copy.cancelPreview.sectionLead}</p>

          <div className="cancel-ticket-preview">
            {cancelPreviewDone ? (
              <div className="cancel-done-box" role="status">
                <div className="done-icon">
                  <FaCheck aria-hidden="true" />
                </div>
                <h3>{copy.cancelPreview.cancelledTitle}</h3>
                <p>{copy.cancelPreview.cancelledText}</p>
                <button
                  type="button"
                  className="btn-restore-preview"
                  onClick={() => setCancelPreviewDone(false)}
                >
                  {copy.cancelPreview.restoreBtn}
                </button>
              </div>
            ) : (
              <>
                <div className="cancel-preview-head">
                  <h3>{copy.cancelPreview.title}</h3>
                  <p>{copy.cancelPreview.subtitle}</p>
                </div>
                <div className="cancel-summary-rows">
                  <div>
                    <span>{copy.cancelPreview.participant}</span>
                    <strong>{copy.cancelPreview.sampleName}</strong>
                  </div>
                  <div>
                    <span>{copy.cancelPreview.dateLabel}</span>
                    <strong className="tabular-nums">
                      <FaClock aria-hidden="true" /> {copy.schedule.days.Wednesday}, 19:00
                    </strong>
                  </div>
                  <div>
                    <span>{copy.cancelPreview.shoesLabel}</span>
                    <strong>{copy.cancelPreview.sampleShoes}</strong>
                  </div>
                </div>
                <div className="cancel-preview-actions">
                  <button
                    type="button"
                    className="btn-cancel-confirm"
                    onClick={() => setCancelPreviewDone(true)}
                  >
                    {copy.cancelPreview.confirmBtn}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-keep"
                    onClick={() => scrollToSection('demo-schedule')}
                  >
                    {copy.cancelPreview.keepBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className={`jwj-concepts-demo concept-${activeConcept}`} lang={lang}>
      {renderHeader()}

      <main>
        {renderHero()}
        {renderSchedule()}
        {renderAbout()}
        {renderGallery()}
        {renderReviews()}
        {renderFaqAndCancel()}
      </main>

      {/* Lightbox for Gallery */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            className="demo-lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              className="demo-lightbox-card"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lightbox-close-btn"
                aria-label={copy.gallery.closeLightbox}
                onClick={() => setLightboxItem(null)}
              >
                <FaTimes aria-hidden="true" />
              </button>
              <img src={lightboxItem.src} alt={lightboxItem.caption} />
              <p>{lightboxItem.caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Booking Modal */}
      <DemoBookingModal
        isOpen={Boolean(activeModalWorkout)}
        onClose={() => setModalWorkoutId(null)}
        workout={activeModalWorkout}
        concept={activeConcept}
        lang={lang}
        copy={copy}
        isBookedByUser={Boolean(activeModalWorkout && demoBookings[activeModalWorkout.Id])}
        userBookingInfo={activeModalWorkout ? demoBookings[activeModalWorkout.Id] : null}
        onBookSuccess={handleDemoBookSuccess}
        onCancelBooking={handleDemoCancelBooking}
      />

      {/* Floating Concept Switcher & Palette Dock */}
      <aside className="concept-switcher-dock" aria-label={copy.dock.label}>
        <AnimatePresence>
          {showPaletteCard && (
            <motion.div
              className="dock-palette-popover"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="popover-head">
                <strong>
                  {currentConceptMeta.number}. {lang === 'bg' ? currentConceptMeta.nameBg : currentConceptMeta.nameEn}
                </strong>
                <span>
                  {currentConceptMeta.fonts.display} + {currentConceptMeta.fonts.body}
                </span>
              </div>
              <p className="popover-motion">
                {lang === 'bg' ? currentConceptMeta.motionNoteBg : currentConceptMeta.motionNoteEn}
              </p>
              <div className="swatch-row">
                {currentConceptMeta.swatches.map((sw) => (
                  <div key={sw.hex} className="swatch-item">
                    <span className="swatch-dot" style={{ backgroundColor: sw.hex }} />
                    <code>{sw.hex}</code>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dock-bar">
          <div className="dock-concept-tabs" role="group" aria-label={copy.dock.label}>
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={activeConcept === c.id}
                className={`dock-concept-btn ${activeConcept === c.id ? 'is-active' : ''}`}
                onClick={() => handleSelectConcept(c.id)}
              >
                <span className="dock-num">{c.number}</span>
                <span className="dock-name">{c.shortName}</span>
              </button>
            ))}
          </div>

          <div className="dock-utilities">
            <button
              type="button"
              className={`dock-util-btn ${showPaletteCard ? 'is-active' : ''}`}
              onClick={() => setShowPaletteCard((v) => !v)}
              aria-expanded={showPaletteCard}
              title={copy.dock.paletteLabel}
            >
              <FaPalette aria-hidden="true" />
              <span className="hide-mobile">{copy.dock.paletteLabel}</span>
            </button>

            <button
              type="button"
              className="dock-util-btn"
              onClick={() => setLang((prev) => (prev === 'bg' ? 'en' : 'bg'))}
            >
              {lang === 'bg' ? 'EN' : 'BG'}
            </button>

            <Link to="/" className="dock-back-link" title={copy.dock.backToOriginal}>
              <FaArrowLeft aria-hidden="true" />
              <span className="hide-mobile">{copy.dock.backToOriginal}</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ConceptsDemo;
