import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FaMapMarkerAlt,
  FaStar,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaBars,
  FaCheck,
  FaShoePrints,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaQuoteLeft,
} from 'react-icons/fa';
import axios from '../../api/axius';
import { parseWorkoutDate, formatWorkoutDateBg } from '../../utils/workoutDate';
import { COPY, SHOE_SIZES, createFallbackWorkouts } from './demoData';
import DemoBookingModal from './DemoBookingModal';
import './AltitudeDemo.scss';

const HERO_WEBM = '/images/main_page.webm';
const HERO_MP4 = '/images/main_page.mp4';
const HERO_POSTER = '/images/main_page_poster.webp';

const ALTITUDE_STOPS = [
  { id: 'alt-hero', meters: 0, labelBg: 'Начало', labelEn: 'Start' },
  { id: 'alt-schedule', meters: 120, labelBg: 'График', labelEn: 'Schedule' },
  { id: 'alt-about', meters: 240, labelBg: 'За мен', labelEn: 'About' },
  { id: 'alt-gallery', meters: 340, labelBg: 'Галерия', labelEn: 'Gallery' },
  { id: 'alt-reviews', meters: 420, labelBg: 'Отзиви', labelEn: 'Reviews' },
  { id: 'alt-contact', meters: 500, labelBg: 'Контакт', labelEn: 'Contact' },
];

const ALTITUDE_LABELS = {
  bg: {
    metersUnit: 'м',
    metersFullUnit: 'метра',
    altimeterAria: 'Висотомер и бърза навигация по секции',
    heroTitle: 'Скачай с Жени',
    heroLead:
      'Динамични Kangoo Jumps тренировки в Бургас, където забавлението, кардиото и щадящият отскок се срещат.',
    instructorRole: 'Жени · Сертифициран инструктор',
    heroFacts: ['-80% ставен стрес', 'Обувки S–XL на място', 'Записване без регистрация'],
    prepTitle: 'Какво да нося за първа тренировка?',
    prepItems: [
      { title: 'Високи чорапи', desc: 'Над глезена, за максимален комфорт в обувките' },
      { title: 'Вода и малка кърпа', desc: 'Кардио зарядът в залата е гарантиран' },
      { title: 'CoolFit & Pulse', desc: 'Приемаме карти CoolFit, Pulse и единични посещения' },
    ],
    switchBackDark: 'Тъмни концепции',
    navMenuOpen: 'Отвори меню',
    navMenuClose: 'Затвори меню',
    contactTitle: 'Свържи се с нас',
    contactSubtitle: 'Имаш въпрос за обувките, групата или пробен час? Пиши ни директно.',
    contactNameLabel: 'Име',
    contactName: 'Твоето име',
    contactEmailLabel: 'Имейл',
    contactEmail: 'Имейл за обратна връзка',
    contactSubjectLabel: 'Тема',
    contactSubjects: [
      { id: 'trial', label: 'Пробен час' },
      { id: 'shoes', label: 'Размери обувки' },
      { id: 'cards', label: 'Карти CoolFit / Pulse' },
      { id: 'other', label: 'Друг въпрос' },
    ],
    contactMsgLabel: 'Съобщение',
    contactMsg: 'Напиши ни въпроса си...',
    contactSend: 'Изпрати запитване',
    contactSent: 'Запитването е прието (демо)! Ще ти отговорим скоро.',
    navContacts: 'Контакт',
    navReviews: 'Отзиви',
    address: 'ж.к. Зорница 75, партер, Бургас',
    altitudeTag: '{{m}} м',
    urgentLastOne: 'Последно място!',
    urgentLastFew: 'Последни {{n}} места!',
    spotsSummary: '{{free}} свободни от {{total}} места',
    prevPhoto: 'Предишна снимка',
    nextPhoto: 'Следваща снимка',
    footerDeletion: 'Изтриване на данни',
  },
  en: {
    metersUnit: 'm',
    metersFullUnit: 'meters',
    altimeterAria: 'Altimeter and section quick navigation',
    heroTitle: 'Jump With Jenny',
    heroLead:
      'High-energy Kangoo Jumps sessions in Burgas where music, joint-safe rebound, and real results come together.',
    instructorRole: 'Jenny · Certified Instructor',
    heroFacts: ['-80% joint impact', 'Boots S–XL included', 'No signup needed'],
    prepTitle: 'What to bring for your first bounce?',
    prepItems: [
      { title: 'Tall socks', desc: 'Above the ankle for snug boot comfort' },
      { title: 'Water & small towel', desc: 'Expect an uplifting cardio burn' },
      { title: 'CoolFit & Pulse', desc: 'CoolFit, Pulse Fitness & single sessions welcome' },
    ],
    switchBackDark: 'Dark concepts',
    navMenuOpen: 'Open menu',
    navMenuClose: 'Close menu',
    contactTitle: 'Get in touch',
    contactSubtitle: 'Have a question about boot sizes, your first class, or group schedule? Write to us.',
    contactNameLabel: 'Name',
    contactName: 'Your name',
    contactEmailLabel: 'Email',
    contactEmail: 'Email address',
    contactSubjectLabel: 'Topic',
    contactSubjects: [
      { id: 'trial', label: 'Trial class' },
      { id: 'shoes', label: 'Boot sizes' },
      { id: 'cards', label: 'CoolFit / Pulse cards' },
      { id: 'other', label: 'Other question' },
    ],
    contactMsgLabel: 'Message',
    contactMsg: 'Write your question...',
    contactSend: 'Send message',
    contactSent: 'Demo message received! We will get back to you shortly.',
    navContacts: 'Contact',
    navReviews: 'Reviews',
    address: 'Zornitsa 75, ground floor, Burgas',
    altitudeTag: '{{m}} m',
    urgentLastOne: 'Last spot!',
    urgentLastFew: 'Only {{n}} spots left!',
    spotsSummary: '{{free}} of {{total}} spots free',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    footerDeletion: 'Data deletion',
  },
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

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const AltitudeDemo = () => {
  const prefersReducedMotion = useReducedMotion();
  const [lang, setLang] = useState('bg');
  const [workouts, setWorkouts] = useState(() => createFallbackWorkouts());
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [demoBookings, setDemoBookings] = useState({});
  const [modalWorkoutId, setModalWorkoutId] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('alt-hero');
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subjectKey: 'trial',
    message: '',
  });

  const skyDayRef = useRef(null);
  const skyNightRef = useRef(null);
  const altFillRef = useRef(null);
  const altBootRef = useRef(null);
  const altTextRef = useRef(null);
  const mobileAltTextRef = useRef(null);
  const mobileAltBarRef = useRef(null);
  const demoBookingsRef = useRef(demoBookings);

  useEffect(() => {
    demoBookingsRef.current = demoBookings;
  }, [demoBookings]);

  const copy = COPY[lang];
  const altCopy = ALTITUDE_LABELS[lang];
  const galleryItems = copy.gallery.items;

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

  useEffect(() => {
    let rafId = null;

    const updateAltitude = () => {
      rafId = null;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const meters = Math.round(p * 500);

      let dayOpacity = 0;
      if (p > 0.08 && p <= 0.26) {
        dayOpacity = (p - 0.08) / 0.18;
      } else if (p > 0.26 && p <= 0.62) {
        dayOpacity = 1;
      } else if (p > 0.62 && p <= 0.82) {
        dayOpacity = 1 - (p - 0.62) / 0.2;
      }

      let nightOpacity = 0;
      if (p > 0.62) {
        nightOpacity = Math.min(1, (p - 0.62) / 0.24);
      }

      if (skyDayRef.current) {
        skyDayRef.current.style.opacity = dayOpacity.toFixed(3);
      }
      if (skyNightRef.current) {
        skyNightRef.current.style.opacity = nightOpacity.toFixed(3);
      }
      if (altFillRef.current) {
        altFillRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
      }
      if (altBootRef.current) {
        altBootRef.current.style.transform = `translateY(${(-p * 120).toFixed(1)}px)`;
      }
      if (altTextRef.current) {
        altTextRef.current.textContent = String(meters);
      }
      if (mobileAltTextRef.current) {
        mobileAltTextRef.current.textContent = String(meters);
      }
      if (mobileAltBarRef.current) {
        mobileAltBarRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }

      // Update active milestone only when the active section ID actually changes
      const triggerY = window.scrollY + window.innerHeight * 0.35;
      let currentId = ALTITUDE_STOPS[0].id;
      for (let i = 0; i < ALTITUDE_STOPS.length; i += 1) {
        const el = document.getElementById(ALTITUDE_STOPS[i].id);
        if (el && el.offsetTop <= triggerY) {
          currentId = ALTITUDE_STOPS[i].id;
        }
      }
      setActiveSection((prev) => (prev === currentId ? prev : currentId));
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateAltitude);
      }
    };

    updateAltitude();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen && lightboxIndex === null) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        return;
      }

      if (lightboxIndex !== null && galleryItems.length > 0) {
        if (e.key === 'ArrowRight') {
          setLightboxIndex((prev) => (prev + 1) % galleryItems.length);
        } else if (e.key === 'ArrowLeft') {
          setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, lightboxIndex, galleryItems.length]);

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

  const activeLightboxItem =
    lightboxIndex !== null && galleryItems[lightboxIndex] ? galleryItems[lightboxIndex] : null;

  const scrollToSection = useCallback(
    (sectionId) => {
      setIsMobileMenuOpen(false);
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
    setDemoBookings((prev) => ({ ...prev, [workoutId]: bookingInfo }));

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

  const handleDemoCancelBooking = useCallback((workoutId) => {
    const existing = demoBookingsRef.current[workoutId];
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
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', subjectKey: 'trial', message: '' });
  };

  const nextDayName = nextAvailableWorkout?.Day
    ? copy.schedule.days[nextAvailableWorkout.Day] || nextAvailableWorkout.Day
    : '';

  const navItems = [
    { id: 'alt-schedule', label: copy.nav.schedule },
    { id: 'alt-about', label: copy.nav.about },
    { id: 'alt-gallery', label: copy.nav.gallery },
    { id: 'alt-reviews', label: altCopy.navReviews },
    { id: 'alt-faq', label: copy.nav.faq },
    { id: 'alt-contact', label: altCopy.navContacts },
  ];

  return (
    <div className="jwj-altitude-demo" lang={lang}>
      {/* Fixed Sky Layers transitioning smoothly with scroll */}
      <div className="alt-sky-backdrop" aria-hidden="true">
        <div className="sky-layer sky-dawn" />
        <div ref={skyDayRef} className="sky-layer sky-day" />
        <div ref={skyNightRef} className="sky-layer sky-night" />
      </div>

      {/* Interactive Right-Side Altimeter Rail with Milestone Stops */}
      <nav className="alt-meter-rail" aria-label={altCopy.altimeterAria}>
        <div className="alt-readout">
          <span ref={altTextRef} className="alt-num tabular-nums">
            0
          </span>
          <span className="alt-unit">{altCopy.metersFullUnit}</span>
        </div>

        <div className="alt-track-wrap">
          <div className="alt-track-bg">
            <div ref={altFillRef} className="alt-track-fill" />
          </div>
          <div ref={altBootRef} className="alt-boot-climber" aria-hidden="true">
            <img src="/brand_logo.png" alt="" />
          </div>
        </div>

        <ul className="alt-stops-list">
          {ALTITUDE_STOPS.map((stop) => {
            const label = lang === 'bg' ? stop.labelBg : stop.labelEn;
            const isActive = activeSection === stop.id;
            return (
              <li key={stop.id}>
                <button
                  type="button"
                  className={`alt-stop-btn ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'location' : undefined}
                  aria-label={`${label} (${stop.meters} ${altCopy.metersUnit})`}
                  onClick={() => scrollToSection(stop.id)}
                >
                  <span className="alt-stop-tooltip">
                    {label} · {stop.meters} {altCopy.metersUnit}
                  </span>
                  <span className="alt-stop-dot" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Top Navigation + Mobile Altimeter Progress */}
      <header className="alt-nav">
        <div className="alt-container alt-nav-inner">
          <a
            href="#alt-hero"
            className="alt-brand"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('alt-hero');
            }}
          >
            <img src="/brand_logo.png" alt="Jump With Jenny" />
            <span>{copy.brand}</span>
          </a>

          <nav className="alt-nav-links" aria-label={copy.nav.schedule}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? 'is-active' : ''}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="alt-nav-actions">
            <button
              type="button"
              className="alt-mobile-meter"
              aria-label={altCopy.altimeterAria}
              onClick={() => scrollToSection('alt-schedule')}
            >
              <span className="mobile-meter-dot" aria-hidden="true" />
              <span ref={mobileAltTextRef} className="tabular-nums">
                0
              </span>
              <span>{altCopy.metersUnit}</span>
            </button>

            <Link to="/concepts-demo?concept=2" className="alt-switch-link">
              {altCopy.switchBackDark}
            </Link>

            <button
              type="button"
              className="alt-lang-btn"
              onClick={() => setLang((prev) => (prev === 'bg' ? 'en' : 'bg'))}
            >
              {lang === 'bg' ? 'EN' : 'BG'}
            </button>

            <button
              type="button"
              className="alt-nav-cta"
              onClick={() => scrollToSection('alt-schedule')}
            >
              {copy.nav.bookCta}
            </button>

            <button
              type="button"
              className="alt-mobile-menu-btn"
              aria-expanded={isMobileMenuOpen}
              aria-controls="alt-mobile-drawer"
              aria-label={isMobileMenuOpen ? altCopy.navMenuClose : altCopy.navMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* 3px Mobile Altitude Progress Line */}
        <div className="alt-nav-progress" aria-hidden="true">
          <div ref={mobileAltBarRef} className="alt-nav-progress-fill" />
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="alt-mobile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.nav
              id="alt-mobile-drawer"
              className="alt-mobile-drawer"
              aria-label={copy.nav.schedule}
              initial={prefersReducedMotion ? { opacity: 0 } : { y: -18, opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: -14, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="alt-mobile-drawer-links">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={activeSection === item.id ? 'is-active' : ''}
                    onClick={() => scrollToSection(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="alt-mobile-drawer-footer">
                <button
                  type="button"
                  className="alt-drawer-secondary"
                  onClick={() => {
                    setLang((prev) => (prev === 'bg' ? 'en' : 'bg'));
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {lang === 'bg' ? 'English (EN)' : 'Български (BG)'}
                </button>
                <Link
                  to="/concepts-demo?concept=2"
                  className="alt-drawer-secondary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {altCopy.switchBackDark}
                </Link>
                <button
                  type="button"
                  className="alt-drawer-primary"
                  onClick={() => scrollToSection('alt-schedule')}
                >
                  {copy.nav.bookCta}
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* HERO SECTION (0 m) with real studio video + high-contrast CTA + Jenny portrait card */}
        <section id="alt-hero" className="alt-hero">
          <div className="alt-hero-video-wrap" aria-hidden="true">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={HERO_POSTER}
              className="alt-hero-video"
            >
              <source src={HERO_WEBM} type="video/webm" />
              <source src={HERO_MP4} type="video/mp4" />
            </video>
            <div className="alt-hero-scrim" />
          </div>

          <div className="alt-container alt-hero-grid">
            <motion.div
              className="alt-hero-copy"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="alt-location-pill">
                <FaMapMarkerAlt aria-hidden="true" />
                <span>{copy.locationBadge}</span>
              </div>

              <h1 className="alt-hero-title">{altCopy.heroTitle}</h1>
              <p className="alt-hero-lead">{altCopy.heroLead}</p>

              <div className="alt-hero-actions">
                <button
                  type="button"
                  className="alt-cta-primary"
                  onClick={() => scrollToSection('alt-schedule')}
                >
                  {copy.hero.ctaPrimary}
                </button>

                {nextAvailableWorkout && (
                  <button
                    type="button"
                    className="alt-next-slot-pill"
                    onClick={() => setModalWorkoutId(nextAvailableWorkout.Id)}
                  >
                    <span>{copy.hero.nextClassLabel}</span>
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

              <ul className="alt-hero-trust-row">
                {altCopy.heroFacts.map((fact) => (
                  <li key={fact}>
                    <FaCheck aria-hidden="true" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="alt-hero-jenny-card"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="jenny-photo-box">
                <img
                  src="/images/jenny.webp"
                  alt="Жени — Kangoo Jumps Бургас"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="jenny-card-body">
                <strong>{altCopy.instructorRole}</strong>
                <div className="jenny-facts-row">
                  {altCopy.heroFacts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Multi-layered SVG Cloud Horizon transitioning cleanly to the Schedule Sky */}
          <div className="alt-cloud-horizon" aria-hidden="true">
            <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="horizon-svg">
              <path
                d="M0,110 C120,60 220,62 320,96 C410,40 540,42 640,88 C740,34 880,38 980,92 C1090,46 1230,52 1340,94 C1390,74 1420,76 1440,86 L1440,160 L0,160 Z"
                fill="rgba(255, 255, 255, 0.32)"
              />
              <path
                d="M0,128 C95,88 190,94 270,118 C365,68 490,72 585,112 C695,62 820,68 915,112 C1025,68 1155,74 1255,114 C1330,86 1395,92 1440,110 L1440,160 L0,160 Z"
                fill="rgba(169, 212, 255, 0.28)"
              />
            </svg>
          </div>
        </section>

        {/* SCHEDULE SECTION — Clean Architectural Sky Cards */}
        <section
          id="alt-schedule"
          className="alt-section alt-schedule-section"
          aria-labelledby="alt-schedule-heading"
        >
          <div className="alt-container">
            <div className="alt-section-head">
              <div>
                <h2 id="alt-schedule-heading" className="alt-section-title">
                  {copy.schedule.title}
                </h2>
                <p className="alt-section-subtitle">{copy.schedule.subtitle}</p>
              </div>
              <span className="alt-source-badge">
                {isLiveSource ? copy.schedule.demoSourceLive : copy.schedule.demoSourcePreview}
              </span>
            </div>

            <div className="alt-day-pills" role="tablist" aria-label={copy.schedule.title}>
              <button
                type="button"
                role="tab"
                aria-selected={selectedDay === 'ALL'}
                className={`alt-day-pill ${selectedDay === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setSelectedDay('ALL')}
              >
                {copy.schedule.allDays}
              </button>
              {availableDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={selectedDay === day}
                  className={`alt-day-pill ${selectedDay === day ? 'is-active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {copy.schedule.shortDays[day] || day}
                </button>
              ))}
            </div>

            <div className="alt-clouds-grid">
              {filteredWorkouts.map((workout, idx) => {
                const counts = getShoeAvailabilityCounts(workout);
                const total =
                  workout.TotalSpots ||
                  (workout.TakenSpots ?? 0) + (workout.AvailableSpots ?? 0) ||
                  12;
                const available = Math.max(0, workout.AvailableSpots ?? 0);
                const isBookedByMe = Boolean(demoBookings[workout.Id]);
                const isFull = available <= 0 || workout.Status?.toLowerCase() === 'booked';
                const isUrgent = !isBookedByMe && !isFull && available <= 2;
                const canOpen = !isFull || isBookedByMe;
                const dayName = copy.schedule.days[workout.Day] || workout.Day;
                const dateLabel = formatWorkoutDateBg(workout.Date);
                const altitudeMeters = 120 + idx * 45;

                const statusLabel = isBookedByMe
                  ? copy.schedule.registered
                  : isFull
                    ? copy.schedule.full
                    : isUrgent
                      ? available === 1
                        ? altCopy.urgentLastOne
                        : altCopy.urgentLastFew.replace('{{n}}', available)
                      : `${available} ${available === 1 ? copy.schedule.spotLeftSingular : copy.schedule.spotsLeft}`;

                const statusClass = isBookedByMe
                  ? 'is-mine'
                  : isFull
                    ? 'is-full'
                    : isUrgent
                      ? 'is-urgent'
                      : 'is-open';

                return (
                  <article
                    key={workout.Id}
                    className={`sculpted-cloud-card ${isFull && !isBookedByMe ? 'is-full' : ''} ${isBookedByMe ? 'is-registered' : ''}`}
                  >
                    <div className="cloud-card-body">
                      <div className="cloud-card-meta">
                        <span className="cloud-altitude-tag tabular-nums">
                          {altCopy.altitudeTag.replace('{{m}}', altitudeMeters)}
                        </span>
                        <span className={`cloud-status-pill ${statusClass}`}>{statusLabel}</span>
                      </div>

                      <div className="cloud-time-block">
                        <h3>{dayName}</h3>
                        <div className="cloud-time-row">
                          <strong className="cloud-time tabular-nums">{workout.Time}</strong>
                          <span className="cloud-date tabular-nums">{dateLabel}</span>
                        </div>
                      </div>

                      {/* Free spots first on the LEFT, taken on the RIGHT */}
                      <div className="cloud-seats-group">
                        <div className="cloud-dots-meter" aria-hidden="true">
                          {Array.from({ length: total }).map((_, dotIdx) => {
                            const isFree = dotIdx < available;
                            return (
                              <span
                                key={dotIdx}
                                className={`seat-dot ${isFree ? 'is-free' : 'is-taken'}`}
                              />
                            );
                          })}
                        </div>
                        <span className="cloud-seats-summary tabular-nums">
                          {altCopy.spotsSummary
                            .replace('{{free}}', available)
                            .replace('{{total}}', total)}
                        </span>
                      </div>

                      <div className="cloud-shoes-block">
                        <span className="cloud-shoes-label">
                          <FaShoePrints aria-hidden="true" /> {copy.schedule.shoesAvailableLabel}
                        </span>
                        <div className="cloud-shoes-row">
                          {SHOE_SIZES.map((sz) => (
                            <span
                              key={sz.key}
                              className={`cloud-shoe-pill ${counts[sz.key] > 0 ? 'has-stock' : 'is-empty'}`}
                            >
                              {sz.key}: <strong className="tabular-nums">{counts[sz.key]}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canOpen}
                        className="cloud-book-btn"
                        onClick={() => canOpen && setModalWorkoutId(workout.Id)}
                      >
                        {isBookedByMe
                          ? copy.schedule.manageButton
                          : isFull
                            ? copy.schedule.full
                            : copy.schedule.bookButton}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT + FIRST-TIME PREP STRIP */}
        <section id="alt-about" className="alt-section" aria-labelledby="alt-about-heading">
          <div className="alt-container">
            <div className="alt-about-card">
              <div className="alt-about-portrait">
                <img
                  src="/images/jenny.webp"
                  alt="Жени — Kangoo Jumps инструктор"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="alt-about-copy">
                <h2 id="alt-about-heading" className="alt-section-title">
                  {copy.about.title}
                </h2>
                <p className="alt-about-lead">{copy.about.lead}</p>
                <blockquote className="alt-about-quote">{copy.about.quote}</blockquote>

                <div className="alt-pillars-row">
                  {copy.about.pillars.map((p) => (
                    <div key={p.title} className="alt-pillar-pill">
                      <span className="pillar-num tabular-nums">{p.value}</span>
                      <strong>{p.title}</strong>
                      <p>{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="alt-prep-strip">
              <h3>{altCopy.prepTitle}</h3>
              <div className="alt-prep-grid">
                {altCopy.prepItems.map((item) => (
                  <div key={item.title} className="alt-prep-chip">
                    <span className="prep-check" aria-hidden="true">
                      <FaCheck />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY — Editorial Bento Grid + Keyboard Lightbox */}
        <section id="alt-gallery" className="alt-section" aria-labelledby="alt-gallery-heading">
          <div className="alt-container">
            <div className="alt-section-head">
              <div>
                <h2 id="alt-gallery-heading" className="alt-section-title">
                  {copy.gallery.title}
                </h2>
                <p className="alt-section-subtitle">{copy.gallery.subtitle}</p>
              </div>
            </div>

            <div className="alt-bento-grid">
              {galleryItems.map((item, idx) => (
                <button
                  key={item.src}
                  type="button"
                  className={`alt-bento-tile ${idx === 0 ? 'is-featured' : ''}`}
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img src={item.src} alt={item.caption} loading="lazy" decoding="async" />
                  <span className="bento-caption">{item.caption}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS — Editorial 2x2 Cards */}
        <section id="alt-reviews" className="alt-section" aria-labelledby="alt-reviews-heading">
          <div className="alt-container">
            <div className="alt-section-head">
              <div>
                <h2 id="alt-reviews-heading" className="alt-section-title">
                  {copy.reviews.title}
                </h2>
                <p className="alt-section-subtitle">{copy.reviews.subtitle}</p>
              </div>
            </div>

            <div className="alt-reviews-grid">
              {copy.reviews.items.map((rev, idx) => (
                <article key={rev.name} className={`alt-review-card accent-${idx % 4}`}>
                  <div className="review-card-top">
                    <span className="review-quote-mark" aria-hidden="true">
                      <FaQuoteLeft />
                    </span>
                    <div className="review-stars" aria-label={`${rev.rating} / 5`}>
                      {Array.from({ length: rev.rating }).map((_, sIdx) => (
                        <FaStar key={sIdx} aria-hidden="true" />
                      ))}
                    </div>
                  </div>

                  <p className="review-quote">„{rev.comment}“</p>

                  <div className="review-author-row">
                    <span className="review-initials" aria-hidden="true">
                      {getInitials(rev.name)}
                    </span>
                    <div className="review-author-meta">
                      <strong>{rev.name}</strong>
                      <span>{rev.tag}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ + CONTACTS (500 m Starry Night Summit) */}
        <section id="alt-faq" className="alt-section" aria-labelledby="alt-faq-heading">
          <div className="alt-container">
            <h2 id="alt-faq-heading" className="alt-section-title">
              {copy.faq.title}
            </h2>

            <div className="alt-faq-grid">
              {copy.faq.items.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={item.q} className={`alt-faq-item ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="alt-faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    >
                      <span>{item.q}</span>
                      <FaChevronDown className="alt-faq-chevron" aria-hidden="true" />
                    </button>
                    <div className="alt-faq-answer-wrap">
                      <div className="alt-faq-answer-inner">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="alt-contact"
          className="alt-section alt-contact-section"
          aria-labelledby="alt-contact-heading"
        >
          <div className="alt-container alt-contact-grid">
            <div className="alt-contact-form-card">
              <h2 id="alt-contact-heading" className="alt-section-title dark-ink">
                {altCopy.contactTitle}
              </h2>
              <p className="alt-contact-lead">{altCopy.contactSubtitle}</p>

              <form onSubmit={handleContactSubmit} className="alt-contact-form">
                <div className="alt-field">
                  <label htmlFor="alt-contact-name">{altCopy.contactNameLabel}</label>
                  <input
                    id="alt-contact-name"
                    type="text"
                    required
                    placeholder={altCopy.contactName}
                    value={contactForm.name}
                    onChange={(e) => {
                      setContactForm((p) => ({ ...p, name: e.target.value }));
                      setContactSent(false);
                    }}
                  />
                </div>

                <div className="alt-field">
                  <label htmlFor="alt-contact-email">{altCopy.contactEmailLabel}</label>
                  <input
                    id="alt-contact-email"
                    type="email"
                    required
                    placeholder={altCopy.contactEmail}
                    value={contactForm.email}
                    onChange={(e) => {
                      setContactForm((p) => ({ ...p, email: e.target.value }));
                      setContactSent(false);
                    }}
                  />
                </div>

                <div className="alt-field">
                  <label htmlFor="alt-contact-subject">{altCopy.contactSubjectLabel}</label>
                  <select
                    id="alt-contact-subject"
                    value={contactForm.subjectKey}
                    onChange={(e) => {
                      setContactForm((p) => ({ ...p, subjectKey: e.target.value }));
                      setContactSent(false);
                    }}
                  >
                    {altCopy.contactSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="alt-field">
                  <label htmlFor="alt-contact-msg">{altCopy.contactMsgLabel}</label>
                  <textarea
                    id="alt-contact-msg"
                    rows={4}
                    required
                    placeholder={altCopy.contactMsg}
                    value={contactForm.message}
                    onChange={(e) => {
                      setContactForm((p) => ({ ...p, message: e.target.value }));
                      setContactSent(false);
                    }}
                  />
                </div>

                <button type="submit" className="alt-cta-primary alt-cta-navy">
                  {altCopy.contactSend}
                </button>
                {contactSent && (
                  <p className="alt-contact-success" role="status">
                    {altCopy.contactSent}
                  </p>
                )}
              </form>
            </div>

            <div className="alt-contact-info-card">
              <div className="alt-map-box">
                <iframe
                  title={altCopy.address}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d526.4989883006733!2d27.466541253362816!3d42.519356308306406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a695df713ef1f3%3A0x7d40c314b363a210!2z0J_Rg9C70YEg0JLQuNGC0LDQuyDRgdC_0L7RgNGC!5e1!3m2!1sbg!2sbg!4v1729614985370!5m2!1sbg!2sbg"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>

              <div className="alt-contact-details">
                <a href="tel:+359884984167">
                  <FaPhoneAlt aria-hidden="true" /> +359 88 4984167
                </a>
                <a href="mailto:jumpwithjenny.kj@gmail.com">
                  <FaEnvelope aria-hidden="true" /> jumpwithjenny.kj@gmail.com
                </a>
                <span>
                  <FaMapMarkerAlt aria-hidden="true" /> {altCopy.address}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="alt-footer">
        <div className="alt-container alt-footer-inner">
          <div className="alt-footer-socials">
            <a href="https://www.facebook.com/jumpwithjenny" target="_blank" rel="noopener noreferrer">
              <FaFacebook aria-hidden="true" /> Facebook
            </a>
            <a href="https://www.tiktok.com/@jump.with.jenny" target="_blank" rel="noopener noreferrer">
              <FaTiktok aria-hidden="true" /> TikTok
            </a>
            <a href="https://www.instagram.com/jump.with.jenny/" target="_blank" rel="noopener noreferrer">
              <FaInstagram aria-hidden="true" /> Instagram
            </a>
          </div>
          <div className="alt-footer-links">
            <Link to="/data-deletion">{altCopy.footerDeletion}</Link>
            <span>&copy; {new Date().getFullYear()} Jump With Jenny</span>
          </div>
        </div>
      </footer>

      {/* Accessible Lightbox with Prev / Next + Counter */}
      <AnimatePresence>
        {activeLightboxItem && (
          <motion.div
            className="alt-lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              className="alt-lightbox-card"
              role="dialog"
              aria-modal="true"
              aria-label={activeLightboxItem.caption}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="alt-lightbox-close"
                aria-label={copy.gallery.closeLightbox}
                onClick={() => setLightboxIndex(null)}
              >
                <FaTimes aria-hidden="true" />
              </button>

              <button
                type="button"
                className="alt-lightbox-nav is-prev"
                aria-label={altCopy.prevPhoto}
                onClick={() =>
                  setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)
                }
              >
                <FaChevronLeft aria-hidden="true" />
              </button>

              <button
                type="button"
                className="alt-lightbox-nav is-next"
                aria-label={altCopy.nextPhoto}
                onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryItems.length)}
              >
                <FaChevronRight aria-hidden="true" />
              </button>

              <img src={activeLightboxItem.src} alt={activeLightboxItem.caption} />
              <div className="alt-lightbox-footer">
                <p>{activeLightboxItem.caption}</p>
                <span className="alt-lightbox-counter tabular-nums">
                  {lightboxIndex + 1} / {galleryItems.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Booking Modal with Altitude skin */}
      <DemoBookingModal
        isOpen={Boolean(activeModalWorkout)}
        onClose={() => setModalWorkoutId(null)}
        workout={activeModalWorkout}
        concept="altitude"
        lang={lang}
        copy={copy}
        isBookedByUser={Boolean(activeModalWorkout && demoBookings[activeModalWorkout.Id])}
        userBookingInfo={activeModalWorkout ? demoBookings[activeModalWorkout.Id] : null}
        onBookSuccess={handleDemoBookSuccess}
        onCancelBooking={handleDemoCancelBooking}
      />
    </div>
  );
};

export default AltitudeDemo;
