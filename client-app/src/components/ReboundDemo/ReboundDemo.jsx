import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaBars,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaStar,
  FaTiktok,
  FaTimes,
} from 'react-icons/fa';
import axios from '../../api/axius';
import { parseWorkoutDate } from '../../utils/workoutDate';
import { formatShortDate, groupWorkoutsByCalendarWeek } from '../../hooks/useScheduleWorkouts';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';
import { COPY, createFallbackWorkouts } from '../ConceptsDemo/demoData';
import DemoBookingModal from '../ConceptsDemo/DemoBookingModal';
import './ReboundDemo.scss';

const HERO_WEBM = '/images/main_page.webm';
const HERO_MP4 = '/images/main_page.mp4';
const HERO_POSTER = '/images/main_page_poster.webp';

const SHOE_SIZE_DEFS = [
  { key: 'S', sizeId: 1, label: 'S 36–38' },
  { key: 'M', sizeId: 2, label: 'M 39–41' },
  { key: 'L', sizeId: 3, label: 'L 42–44' },
  { key: 'XL', sizeId: 4, label: 'XL 44–46' },
];

const THEMES = [
  {
    id: 'coastal',
    modalConcept: 'coastal',
    label: 'Морски отскок',
    hint: 'Тъмен Hero + светли секции',
    swatches: ['#0F1D36', '#F4F7FA', '#FF5A36'],
  },
  {
    id: 'studio',
    modalConcept: 'studio',
    label: 'Светло студио',
    hint: 'Изцяло светъл спортен стил',
    swatches: ['#F7F7F5', '#121826', '#FF4F2B'],
  },
  {
    id: 'pulse',
    modalConcept: 'pulse-club',
    label: 'Сцена и пулс',
    hint: 'Енергичен кардио клуб',
    swatches: ['#0F121A', '#181D29', '#FF4757'],
  },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));

const DEMO_NAV_LINKS = [
  { id: 'rb-schedule', label: 'График' },
  { id: 'rb-metrics', label: 'Тренировката' },
  { id: 'rb-first-jump', label: 'Първи скок' },
  { id: 'rb-about', label: 'За мен' },
  { id: 'rb-gallery', label: 'Галерия' },
  { id: 'rb-reviews', label: 'Отзиви' },
  { id: 'rb-faq', label: 'Въпроси' },
  { id: 'rb-contacts', label: 'Контакт' },
];

const DEMO_COPY = {
  brandTitle: 'Jump With Jenny',
  menuOpen: 'Отвори меню',
  menuClose: 'Затвори меню',
  heroKicker: 'Kangoo Jumps · Бургас',
  heroStatsPill: '-80% ставен удар · 50 мин ритъм',
  heroSecondaryCta: 'Как протича часът',
  scheduleSubtitle: 'Избери ден и час. Обувките S–XL се запазват директно с мястото.',
  demoLiveSource: 'Данни от локалния сървър',
  demoOfflineSource: 'Интерактивно демо (можеш да записваш и отменяш)',
  spotUrgentOne: 'Последно място',
  spotUrgentFew: 'Последни {{count}} места',
  shoesIncluded: 'Обувки на място',
  galleryTitle: 'Атмосфера от залата',
  gallerySubtitle: 'Реални кадри от тренировките на Жени — музика, синхрон и усмивки след последния трак.',
  contactSendDemo: 'Съобщението е прието в демо режим! В реалния сайт се изпраща директно до Жени.',
  contactErrRequired: 'Моля, попълни име, валиден имейл и кратко съобщение.',
  contactEmailDirect: 'contact@jumpwithjenny.com',
  contactMapBtn: 'Отвори в Google Maps',
  switcherTitle: 'Визуална посока',
  backToLive: 'Текущ сайт',
  faqOpenHint: 'Кликни за отговор',
};

const pad2 = (num) => String(num).padStart(2, '0');

const getAvailableSizesMap = (workout) => {
  const counts = { S: 0, M: 0, L: 0, XL: 0 };
  if (!Array.isArray(workout?.WorkoutShoes)) return counts;

  workout.WorkoutShoes.forEach((ws) => {
    if (!ws.IsTaken && ws.Shoe) {
      const match = SHOE_SIZE_DEFS.find((s) => s.sizeId === ws.Shoe.Size);
      if (match) counts[match.key] += 1;
    }
  });

  return counts;
};

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const SpringArcMark = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 64 26"
    width="64"
    height="26"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse
      cx="32"
      cy="13"
      rx="28"
      ry="9.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    />
    <line
      x1="5"
      y1="13"
      x2="59"
      y2="13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.55"
    />
    <circle cx="5" cy="13" r="3" fill="currentColor" />
    <circle cx="59" cy="13" r="3" fill="currentColor" />
  </svg>
);

const ReboundArcDivider = () => (
  <div className="rb-arc-divider" aria-hidden="true">
    <svg viewBox="0 0 1440 72" preserveAspectRatio="none">
      <path d="M0,72 C360,8 1080,8 1440,72 L1440,72 L0,72 Z" fill="currentColor" />
    </svg>
  </div>
);

const ReboundDemo = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTheme = searchParams.get('theme');
  const [theme, setTheme] = useState(() => (THEME_IDS.has(paramTheme) ? paramTheme : 'coastal'));

  const [workouts, setWorkouts] = useState(() => createFallbackWorkouts());
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [demoBookings, setDemoBookings] = useState({});
  const [modalWorkoutId, setModalWorkoutId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'trial',
    message: '',
  });
  const [contactStatus, setContactStatus] = useState({ type: '', text: '' });

  const navRef = useRef(null);
  const lightboxRef = useRef(null);

  const galleryItems = COPY.bg.gallery.items;
  const isLightboxOpen = lightboxIndex !== null && galleryItems.length > 0;

  useEffect(() => {
    const nextParam = searchParams.get('theme');
    if (THEME_IDS.has(nextParam) && nextParam !== theme) {
      setTheme(nextParam);
    }
  }, [searchParams, theme]);

  const handleSelectTheme = useCallback(
    (nextTheme) => {
      setTheme(nextTheme);
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set('theme', nextTheme);
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    axios
      .get('/Schedule/available')
      .then((res) => {
        if (isCancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const now = new Date();
        const upcoming = rows
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
        // Fallback workouts stay active when API is offline in preview mode
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useOutsideClick(navRef, closeMenu, menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    const onResize = () => {
      if (window.innerWidth > 960) closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, closeMenu]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  useModalAccessibility({ isOpen: isLightboxOpen, onClose: closeLightbox, modalRef: lightboxRef });

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex((prev) => (prev + 1) % galleryItems.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen, galleryItems.length]);

  const scrollToSection = useCallback(
    (event, sectionId) => {
      event?.preventDefault();
      closeMenu();
      const target = document.getElementById(sectionId);
      if (target) {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    },
    [closeMenu]
  );

  const weekGroups = useMemo(() => groupWorkoutsByCalendarWeek(workouts, 'bg'), [workouts]);

  const resolvedWeekKey = useMemo(() => {
    if (selectedWeekKey === 'all' && weekGroups.length > 1) return 'all';
    if (selectedWeekKey && weekGroups.some((g) => g.key === selectedWeekKey)) {
      return selectedWeekKey;
    }
    return weekGroups[0]?.key || null;
  }, [selectedWeekKey, weekGroups]);

  const visibleWorkouts = useMemo(() => {
    if (!resolvedWeekKey || resolvedWeekKey === 'all') return workouts;
    return weekGroups.find((g) => g.key === resolvedWeekKey)?.workouts || workouts;
  }, [resolvedWeekKey, weekGroups, workouts]);

  const nextWorkout = useMemo(() => {
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

  const activeThemeMeta = useMemo(
    () => THEMES.find((item) => item.id === theme) || THEMES[0],
    [theme]
  );

  const selectedModalWorkout = useMemo(
    () => workouts.find((w) => w.Id === modalWorkoutId) || null,
    [workouts, modalWorkoutId]
  );

  const handleBookSuccess = useCallback((workoutId, bookingInfo) => {
    setDemoBookings((prev) => ({ ...prev, [workoutId]: bookingInfo }));
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.Id !== workoutId) return w;
        const nextAvail = Math.max(0, (w.AvailableSpots ?? 0) - 1);
        const nextTaken = (w.TakenSpots ?? 0) + 1;
        let shoeReserved = false;
        const updatedShoes = (w.WorkoutShoes || []).map((ws) => {
          if (
            !shoeReserved &&
            !bookingInfo.usesOwnShoes &&
            !ws.IsTaken &&
            ws.Shoe &&
            SHOE_SIZE_DEFS.find((s) => s.sizeId === ws.Shoe.Size)?.key === bookingInfo.shoeSize
          ) {
            shoeReserved = true;
            return { ...ws, IsTaken: true };
          }
          return ws;
        });

        return {
          ...w,
          AvailableSpots: nextAvail,
          TakenSpots: nextTaken,
          Status: nextAvail === 0 ? 'Booked' : w.Status,
          WorkoutShoes: updatedShoes,
        };
      })
    );
  }, []);

  const handleCancelBooking = useCallback(
    (workoutId) => {
      const bookingInfo = demoBookings[workoutId];
      setDemoBookings((prev) => {
        const copy = { ...prev };
        delete copy[workoutId];
        return copy;
      });
      setWorkouts((prev) =>
        prev.map((w) => {
          if (w.Id !== workoutId) return w;
          const total = w.TotalSpots || (w.AvailableSpots ?? 0) + (w.TakenSpots ?? 0) || 12;
          const nextAvail = Math.min(total, (w.AvailableSpots ?? 0) + 1);
          const nextTaken = Math.max(0, (w.TakenSpots ?? 0) - 1);
          let shoeReleased = false;
          const updatedShoes = (w.WorkoutShoes || []).map((ws) => {
            if (
              !shoeReleased &&
              bookingInfo &&
              !bookingInfo.usesOwnShoes &&
              ws.IsTaken &&
              ws.Shoe &&
              SHOE_SIZE_DEFS.find((s) => s.sizeId === ws.Shoe.Size)?.key === bookingInfo.shoeSize
            ) {
              shoeReleased = true;
              return { ...ws, IsTaken: false };
            }
            return ws;
          });

          return {
            ...w,
            AvailableSpots: nextAvail,
            TakenSpots: nextTaken,
            Status: nextAvail > 0 ? 'Available' : w.Status,
            WorkoutShoes: updatedShoes,
          };
        })
      );
    },
    [demoBookings]
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const nameOk = contactForm.name.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim());
    const msgOk = contactForm.message.trim().length >= 4;

    if (!nameOk || !emailOk || !msgOk) {
      setContactStatus({ type: 'error', text: DEMO_COPY.contactErrRequired });
      return;
    }

    setContactStatus({ type: 'success', text: DEMO_COPY.contactSendDemo });
    setContactForm({ name: '', email: '', subject: 'trial', message: '' });
  };

  const marqueeItems = [
    t('altitude.marquee.item1'),
    t('altitude.marquee.item2'),
    t('altitude.marquee.item3'),
    t('altitude.marquee.item4'),
  ];

  const metricsRaw = t('altitude.workoutMetrics.items', { returnObjects: true });
  const metricItems = Array.isArray(metricsRaw) ? metricsRaw : [];

  const stepsRaw = t('altitude.firstJump.steps', { returnObjects: true });
  const firstJumpSteps = Array.isArray(stepsRaw) ? stepsRaw : [];

  const bringRaw = t('altitude.firstJump.bringItems', { returnObjects: true });
  const bringItems = Array.isArray(bringRaw) ? bringRaw : [];

  const aboutHighlightsRaw = t('altitude.about.highlights', { returnObjects: true });
  const aboutHighlights = Array.isArray(aboutHighlightsRaw) ? aboutHighlightsRaw : [];

  const reviewsRaw = t('testimonials.items', { returnObjects: true });
  const allReviews = Array.isArray(reviewsRaw) ? reviewsRaw : [];
  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 6);

  const faqItems = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  const nextWorkoutDay = nextWorkout?.Day
    ? t(`days.${nextWorkout.Day.toLowerCase()}`, { defaultValue: nextWorkout.Day })
    : '';
  const nextWorkoutDate = nextWorkout?.Date ? formatShortDate(nextWorkout.Date, 'bg') : '';
  const nextWorkoutSpots = nextWorkout?.AvailableSpots ?? 0;

  const isLightHeader = theme === 'studio';
  const activeLightboxItem = isLightboxOpen
    ? galleryItems[lightboxIndex % galleryItems.length]
    : null;

  return (
    <div className="rebound-demo" data-theme={theme}>
      {/* Sticky Athletic Header */}
      <header ref={navRef} className={`rb-nav ${menuOpen ? 'is-open' : ''}`}>
        <div className="rb-wrap rb-nav__inner">
          <a
            href="#rb-hero"
            className="rb-nav__brand"
            onClick={(e) => scrollToSection(e, 'rb-hero')}
          >
            <img
              src={isLightHeader ? '/brand_logo.png' : '/images/brand_logo_light.png'}
              alt={t('navbar.logoAlt')}
              width="44"
              height="44"
              className="rb-nav__logo"
            />
            <span className="rb-nav__brand-name">{DEMO_COPY.brandTitle}</span>
          </a>

          <nav aria-label={t('navbar.ariaLabel')}>
            <ul id="rb-primary-nav" className={`rb-nav__links ${menuOpen ? 'is-open' : ''}`}>
              {DEMO_NAV_LINKS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="rb-nav__link"
                    onClick={(e) => scrollToSection(e, item.id)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="rb-nav__mobile-cta">
                <a
                  href="#rb-schedule"
                  className="rb-btn rb-btn--primary"
                  onClick={(e) => scrollToSection(e, 'rb-schedule')}
                >
                  {t('altitude.heroCta')}
                </a>
              </li>
            </ul>
          </nav>

          <div className="rb-nav__actions">
            <a
              href="#rb-schedule"
              className="rb-btn rb-btn--primary rb-nav__cta"
              onClick={(e) => scrollToSection(e, 'rb-schedule')}
            >
              {t('altitude.heroCta')}
            </a>

            <button
              type="button"
              className={`rb-nav__burger ${menuOpen ? 'is-open' : ''}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="rb-primary-nav"
              aria-label={menuOpen ? DEMO_COPY.menuClose : DEMO_COPY.menuOpen}
            >
              {menuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO — Real movement video, crisp contrast, kinetic rebound energy */}
        <section id="rb-hero" className="rb-hero" aria-labelledby="rb-hero-heading">
          {theme !== 'studio' && (
            <div className="rb-hero__backdrop" aria-hidden="true">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={HERO_POSTER}
                className="rb-hero__video"
              >
                <source src={HERO_WEBM} type="video/webm" />
                <source src={HERO_MP4} type="video/mp4" />
              </video>
              <div className="rb-hero__scrim" />
            </div>
          )}

          <div className="rb-wrap rb-hero__grid">
            <div className="rb-hero__copy">
              <div className="rb-hero__kicker">
                <span className="rb-hero__kicker-dot" aria-hidden="true" />
                <span>{DEMO_COPY.heroKicker}</span>
              </div>

              <h1 id="rb-hero-heading" className="rb-hero__title">
                {t('altitude.heroHeadingLine1')}
                <br />
                {t('altitude.heroHeadingLine2')}
              </h1>

              <p className="rb-hero__lead">{t('welcomeText')}</p>

              <div className="rb-hero__actions">
                <a
                  href="#rb-schedule"
                  className="rb-btn rb-btn--primary rb-btn--lg"
                  onClick={(e) => scrollToSection(e, 'rb-schedule')}
                >
                  {t('altitude.heroCta')}
                </a>

                <a
                  href="#rb-first-jump"
                  className="rb-btn rb-btn--ghost rb-btn--lg"
                  onClick={(e) => scrollToSection(e, 'rb-first-jump')}
                >
                  {DEMO_COPY.heroSecondaryCta}
                </a>
              </div>

              <button
                type="button"
                className="rb-next-chip"
                onClick={(e) => scrollToSection(e, 'rb-schedule')}
                aria-label={t('altitude.nextWorkoutLabel')}
              >
                <span className="rb-pulse-dot" aria-hidden="true" />
                <span className="rb-next-chip__body">
                  {nextWorkout ? (
                    <>
                      <strong>
                        {nextWorkoutDay} ({nextWorkoutDate}),{' '}
                        <span className="tabular-nums">{nextWorkout.Time}</span>
                      </strong>
                      <span className="rb-next-chip__meta">
                        <span className="tabular-nums">{countdownText}</span> ·{' '}
                        {nextWorkoutSpots === 1
                          ? t('altitude.spotsAvailableSingular', { count: nextWorkoutSpots })
                          : t('altitude.spotsAvailablePlural', { count: nextWorkoutSpots })}
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>{t('altitude.nextWorkoutLabel')}</strong>
                      <span className="rb-next-chip__meta">{t('altitude.noUpcomingChip')}</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {theme === 'studio' && (
              <div className="rb-hero__stage">
                <div className="rb-hero__media-frame">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={HERO_POSTER}
                    className="rb-hero__stage-video"
                  >
                    <source src={HERO_WEBM} type="video/webm" />
                    <source src={HERO_MP4} type="video/mp4" />
                  </video>
                  <div className="rb-hero__stage-badge">
                    <SpringArcMark className="rb-hero__stage-arc" />
                    <span>{DEMO_COPY.heroStatsPill}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rb-marquee" aria-hidden="true">
            <div className="rb-marquee__track">
              {[0, 1].map((dup) => (
                <div key={dup} className="rb-marquee__group">
                  {marqueeItems.map((item, idx) => (
                    <span key={`${dup}-${idx}`} className="rb-marquee__item">
                      <span>{item}</span>
                      <span className="rb-marquee__sep" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. SCHEDULE — Clean athletic class-pass cards (no clouds) */}
        <section id="rb-schedule" className="rb-section rb-schedule" aria-labelledby="rb-schedule-heading">
          <div className="rb-wrap">
            <div className="rb-section-head">
              <div>
                <h2 id="rb-schedule-heading" className="rb-section-title">
                  {t('schedule.title')}
                </h2>
                <p className="rb-section-subtitle">{DEMO_COPY.scheduleSubtitle}</p>
              </div>

              <span className="rb-source-pill">
                <span className={`rb-source-pill__dot ${isLiveSource ? 'is-live' : ''}`} />
                {isLiveSource ? DEMO_COPY.demoLiveSource : DEMO_COPY.demoOfflineSource}
              </span>
            </div>

            {weekGroups.length > 0 && (
              <div
                className="rb-week-tabs"
                role="tablist"
                aria-label={t('altitude.schedule.weekTabsAria')}
              >
                {weekGroups.map((group) => {
                  const title =
                    group.labelType === 'thisWeek'
                      ? t('altitude.schedule.thisWeek')
                      : group.labelType === 'nextWeek'
                        ? t('altitude.schedule.nextWeek')
                        : t('altitude.schedule.weekRangeLabel', { range: group.rangeText });
                  const isActive = resolvedWeekKey === group.key;

                  return (
                    <button
                      key={group.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`rb-week-tab ${isActive ? 'is-active' : ''}`}
                      onClick={() => setSelectedWeekKey(group.key)}
                    >
                      <strong>{title}</strong>
                      <span>{group.rangeText}</span>
                    </button>
                  );
                })}

                {weekGroups.length > 1 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resolvedWeekKey === 'all'}
                    className={`rb-week-tab ${resolvedWeekKey === 'all' ? 'is-active' : ''}`}
                    onClick={() => setSelectedWeekKey('all')}
                  >
                    <strong>{t('altitude.schedule.allWorkouts', { count: workouts.length })}</strong>
                    <span>{t('altitude.schedule.allSubtitle')}</span>
                  </button>
                )}
              </div>
            )}

            <div className={`rb-cards-grid ${visibleWorkouts.length === 1 ? 'is-single' : ''}`}>
              {visibleWorkouts.map((workout) => {
                const status = workout?.Status?.toLowerCase();
                const isBookedByMe = Boolean(demoBookings[workout.Id]);
                const availableSpots = Math.max(0, workout?.AvailableSpots ?? 0);
                const takenSpots = Math.max(0, workout?.TakenSpots ?? 0);
                const maxSpots = Math.max(
                  1,
                  workout?.TotalSpots || availableSpots + takenSpots || 12
                );
                const isAvailable = status === 'available' && availableSpots > 0;
                const canOpen = isAvailable || isBookedByMe;

                const translatedDay = workout?.Day
                  ? t(`days.${workout.Day.toLowerCase()}`, { defaultValue: workout.Day })
                  : '';
                const shortDate = formatShortDate(workout.Date, 'bg');
                const shoeCounts = getAvailableSizesMap(workout);
                const hasAnyBootsFree = Object.values(shoeCounts).some((c) => c > 0);
                const fillRatio = Math.max(0, Math.min(1, availableSpots / maxSpots));

                const urgencyBadge = isBookedByMe
                  ? t('schedule.registeredBadge')
                  : availableSpots === 1
                    ? DEMO_COPY.spotUrgentOne
                    : availableSpots > 1 && availableSpots <= 3
                      ? DEMO_COPY.spotUrgentFew.replace('{{count}}', availableSpots)
                      : null;

                return (
                  <article
                    key={workout.Id || `${workout.Date}-${workout.Time}`}
                    className={`rb-class-card ${isBookedByMe ? 'is-booked' : ''} ${!isAvailable && !isBookedByMe ? 'is-full' : ''}`}
                  >
                    <div className="rb-class-card__top">
                      <span className="rb-class-card__date">{shortDate}</span>
                      {urgencyBadge ? (
                        <span
                          className={`rb-class-card__badge ${isBookedByMe ? 'is-booked' : 'is-urgent'}`}
                        >
                          {urgencyBadge}
                        </span>
                      ) : (
                        <span className="rb-class-card__badge">{DEMO_COPY.shoesIncluded}</span>
                      )}
                    </div>

                    <div className="rb-class-card__head">
                      <h3 className="rb-class-card__day">{translatedDay}</h3>
                      <b className="rb-class-card__time tabular-nums">{workout.Time}</b>
                    </div>

                    <div className="rb-class-card__meter">
                      {maxSpots <= 12 ? (
                        <div className="rb-class-card__segments" aria-hidden="true">
                          {Array.from({ length: maxSpots }, (_, idx) => (
                            <span
                              key={idx}
                              className={`rb-seg ${idx < maxSpots - availableSpots ? 'is-taken' : ''}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rb-class-card__bar" aria-hidden="true">
                          <span style={{ transform: `scaleX(${fillRatio})` }} />
                        </div>
                      )}
                      <p className="rb-class-card__spots tabular-nums">
                        {t('altitude.schedule.spotsOfMax', {
                          available: availableSpots,
                          max: maxSpots,
                        })}
                      </p>
                    </div>

                    <div className="rb-class-card__sizes">
                      {SHOE_SIZE_DEFS.map((sz) => {
                        const free = shoeCounts[sz.key] || 0;
                        return (
                          <span
                            key={sz.key}
                            className={`rb-size-chip ${free === 0 ? 'is-gone' : ''}`}
                          >
                            {sz.label}
                          </span>
                        );
                      })}
                    </div>

                    {!hasAnyBootsFree && isAvailable && (
                      <p className="rb-class-card__own-only">
                        {t('altitude.schedule.ownShoesOnlyTag')}
                      </p>
                    )}

                    <button
                      type="button"
                      className={`rb-btn rb-class-card__btn ${isBookedByMe ? 'is-manage' : ''}`}
                      disabled={!canOpen}
                      onClick={() => canOpen && setModalWorkoutId(workout.Id)}
                    >
                      {isBookedByMe
                        ? t('altitude.schedule.manageBookingBtn')
                        : isAvailable
                          ? t('altitude.schedule.bookBtn')
                          : t('altitude.schedule.fullClassBtn')}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          {theme === 'coastal' && <ReboundArcDivider />}
        </section>

        {/* Light surface container for coastal (dark-to-light contrast), unified for studio & pulse */}
        <div className="rb-body-band">
          {/* 3. WORKOUT METRICS — Architectural typographic stat strip */}
          <section id="rb-metrics" className="rb-section rb-metrics" aria-labelledby="rb-metrics-heading">
            <div className="rb-wrap">
              <div className="rb-metrics__header">
                <SpringArcMark className="rb-metrics__arc" />
                <div>
                  <h2 id="rb-metrics-heading" className="rb-section-title">
                    {t('altitude.workoutMetrics.title')}
                  </h2>
                  <p className="rb-section-subtitle">{t('altitude.workoutMetrics.subtitle')}</p>
                </div>
              </div>

              <ul className="rb-metrics__strip">
                {metricItems.map((item, idx) => (
                  <li key={idx} className="rb-metric-item">
                    <span className="rb-metric-item__value tabular-nums">{item.value}</span>
                    <h3 className="rb-metric-item__label">{item.label}</h3>
                    <p className="rb-metric-item__desc">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. FIRST JUMP — Sequence steps + crisp preparation checklist */}
          <section
            id="rb-first-jump"
            className="rb-section rb-first-jump"
            aria-labelledby="rb-first-jump-heading"
          >
            <div className="rb-wrap">
              <header className="rb-section-intro">
                <h2 id="rb-first-jump-heading" className="rb-section-title">
                  {t('altitude.firstJump.title')}
                </h2>
                <p className="rb-section-subtitle">{t('altitude.firstJump.subtitle')}</p>
              </header>

              <div className="rb-first-jump__grid">
                <div>
                  <h3 className="rb-col-heading">{t('altitude.firstJump.stepsTitle')}</h3>
                  <ol className="rb-steps-list">
                    {firstJumpSteps.map((step, idx) => (
                      <li key={idx} className="rb-step-item">
                        <span className="rb-step-item__num tabular-nums" aria-hidden="true">
                          {idx + 1}
                        </span>
                        <div className="rb-step-item__body">
                          <h4>{step.title}</h4>
                          <p>{step.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <aside className="rb-checklist-panel" aria-labelledby="rb-bring-heading">
                  <h3 id="rb-bring-heading" className="rb-checklist-panel__title">
                    {t('altitude.firstJump.bringTitle')}
                  </h3>

                  <ul className="rb-bring-list">
                    {bringItems.map((item, idx) => (
                      <li key={idx} className="rb-bring-item">
                        <span className="rb-bring-item__icon" aria-hidden="true">
                          <FaCheck />
                        </span>
                        <div>
                          <div className="rb-bring-item__top">
                            <strong>{item.title}</strong>
                            {item.required ? (
                              <span className="rb-bring-item__badge">
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
                    href="#rb-schedule"
                    className="rb-btn rb-btn--primary rb-checklist-panel__cta"
                    onClick={(e) => scrollToSection(e, 'rb-schedule')}
                  >
                    {t('altitude.firstJump.cta')}
                  </a>
                </aside>
              </div>
            </div>
          </section>

          {/* 5. ABOUT ME — Real instructor photo + pharmacist credibility */}
          <section id="rb-about" className="rb-section rb-about" aria-labelledby="rb-about-heading">
            <div className="rb-wrap">
              <h2 id="rb-about-heading" className="rb-section-title">
                {t('about.title')}
              </h2>

              <div className="rb-about__grid">
                <div className="rb-about__portrait-frame">
                  <picture>
                    <source srcSet="/images/jenny.webp" type="image/webp" />
                    <img
                      src="/images/jenny.jpg"
                      alt={t('about.title')}
                      className="rb-about__portrait"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>

                <div className="rb-about__content">
                  <p className="rb-about__lead">{t('altitude.about.lead')}</p>

                  <div className="rb-about__highlights">
                    {aboutHighlights.map((item, idx) => (
                      <div key={idx} className="rb-about-card">
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. GALLERY — Editorial grid of real studio photography + lightbox */}
          <section id="rb-gallery" className="rb-section rb-gallery" aria-labelledby="rb-gallery-heading">
            <div className="rb-wrap">
              <header className="rb-section-intro">
                <h2 id="rb-gallery-heading" className="rb-section-title">
                  {DEMO_COPY.galleryTitle}
                </h2>
                <p className="rb-section-subtitle">{DEMO_COPY.gallerySubtitle}</p>
              </header>

              <div className="rb-gallery__grid">
                {galleryItems.map((item, idx) => (
                  <button
                    key={item.src}
                    type="button"
                    className={`rb-gallery__tile ${idx === 0 || idx === 2 ? 'is-wide' : ''}`}
                    aria-label={t('altitude.gallery.openLightbox', { index: idx + 1 })}
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img src={item.src} alt={item.caption} loading="lazy" decoding="async" />
                    <span className="rb-gallery__caption">{item.caption}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 7. TESTIMONIALS — Clean readable cards (no floating balloons) */}
          <section id="rb-reviews" className="rb-section rb-reviews" aria-labelledby="rb-reviews-heading">
            <div className="rb-wrap">
              <header className="rb-section-intro">
                <h2 id="rb-reviews-heading" className="rb-section-title">
                  {t('testimonials.title')}
                </h2>
              </header>

              <div className="rb-reviews__grid">
                {visibleReviews.map((review) => {
                  const rating = review.rating || 5;
                  return (
                    <article key={review.id || review.name} className="rb-review-card">
                      <div className="rb-review-card__arc" aria-hidden="true" />
                      <div
                        className="rb-review-card__stars"
                        aria-label={t('testimonials.ratingLabel', { rating })}
                      >
                        {Array.from({ length: rating }, (_, starIdx) => (
                          <FaStar key={starIdx} aria-hidden="true" />
                        ))}
                      </div>

                      <blockquote className="rb-review-card__quote">
                        „{review.comment}“
                      </blockquote>

                      <footer className="rb-review-card__footer">
                        <span className="rb-review-card__avatar" aria-hidden="true">
                          {getInitials(review.name)}
                        </span>
                        <strong>{review.name}</strong>
                      </footer>
                    </article>
                  );
                })}
              </div>

              {allReviews.length > 6 && (
                <div className="rb-reviews__more">
                  <button
                    type="button"
                    className="rb-btn rb-btn--outline"
                    aria-expanded={showAllReviews}
                    onClick={() => setShowAllReviews((prev) => !prev)}
                  >
                    {showAllReviews
                      ? t('altitude.reviews.showLess')
                      : t('altitude.reviews.showMore')}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 8. FAQ — Crisp accessible accordion */}
          <section id="rb-faq" className="rb-section rb-faq" aria-labelledby="rb-faq-heading">
            <div className="rb-wrap rb-faq__wrap">
              <h2 id="rb-faq-heading" className="rb-section-title">
                {t('faq.title')}
              </h2>

              <div className="rb-faq__list">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const panelId = `rb-faq-panel-${idx}`;
                  return (
                    <div key={idx} className={`rb-faq__item ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="rb-faq__trigger"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      >
                        <span>{item.q}</span>
                        <FaChevronDown className="rb-faq__chevron" aria-hidden="true" />
                      </button>
                      {isOpen && (
                        <div id={panelId} className="rb-faq__panel">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 9. CONTACTS — Interactive demo form + studio info */}
          <section id="rb-contacts" className="rb-section rb-contacts" aria-labelledby="rb-contacts-heading">
            <div className="rb-wrap">
              <header className="rb-section-intro">
                <h2 id="rb-contacts-heading" className="rb-section-title">
                  {t('contacts.title')}
                </h2>
                <p className="rb-section-subtitle">{t('contacts.subtitle')}</p>
              </header>

              <div className="rb-contacts__grid">
                <form className="rb-contact-form" onSubmit={handleContactSubmit} noValidate>
                  <div className="rb-field">
                    <label htmlFor="rb-contact-name">{t('contacts.name')}</label>
                    <input
                      id="rb-contact-name"
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => {
                        setContactForm((prev) => ({ ...prev, name: e.target.value }));
                        setContactStatus({ type: '', text: '' });
                      }}
                      placeholder={t('contacts.name')}
                    />
                  </div>

                  <div className="rb-field">
                    <label htmlFor="rb-contact-email">{t('contacts.email')}</label>
                    <input
                      id="rb-contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => {
                        setContactForm((prev) => ({ ...prev, email: e.target.value }));
                        setContactStatus({ type: '', text: '' });
                      }}
                      placeholder={t('contacts.email')}
                    />
                  </div>

                  <div className="rb-field">
                    <label htmlFor="rb-contact-subject">{t('contacts.subject')}</label>
                    <select
                      id="rb-contact-subject"
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, subject: e.target.value }))
                      }
                    >
                      <option value="trial">{t('contacts.subjectTrial')}</option>
                      <option value="training">{t('contacts.subjectTraining')}</option>
                      <option value="shoes">{t('contacts.subjectShoes')}</option>
                      <option value="other">{t('contacts.subjectOther')}</option>
                    </select>
                  </div>

                  <div className="rb-field">
                    <label htmlFor="rb-contact-message">{t('contacts.message')}</label>
                    <textarea
                      id="rb-contact-message"
                      rows="4"
                      value={contactForm.message}
                      onChange={(e) => {
                        setContactForm((prev) => ({ ...prev, message: e.target.value }));
                        setContactStatus({ type: '', text: '' });
                      }}
                      placeholder={t('contacts.message')}
                    />
                  </div>

                  {contactStatus.text && (
                    <div
                      role={contactStatus.type === 'error' ? 'alert' : 'status'}
                      className={`rb-contact-status is-${contactStatus.type}`}
                    >
                      {contactStatus.text}
                    </div>
                  )}

                  <button type="submit" className="rb-btn rb-btn--primary">
                    {t('contacts.send')}
                  </button>
                </form>

                <aside className="rb-contact-info">
                  <div className="rb-contact-card">
                    <h3>{t('contacts.location')}</h3>
                    <p className="rb-contact-card__line">
                      <FaMapMarkerAlt aria-hidden="true" />
                      <span>{t('contacts.address')}</span>
                    </p>
                    <p className="rb-contact-card__line">
                      <FaEnvelope aria-hidden="true" />
                      <a href={`mailto:${DEMO_COPY.contactEmailDirect}`}>
                        {DEMO_COPY.contactEmailDirect}
                      </a>
                    </p>
                    <a
                      href="https://maps.google.com/?q=ж.к.+Зорница+75,+Бургас"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rb-btn rb-btn--outline rb-contact-card__map"
                    >
                      {DEMO_COPY.contactMapBtn}
                    </a>
                  </div>

                  <div className="rb-contact-card">
                    <h3>{t('contacts.socialMedia')}</h3>
                    <div className="rb-contact-socials">
                      <a
                        href="https://www.facebook.com/jumpwithjenny"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rb-social-pill"
                      >
                        <FaFacebook aria-hidden="true" />
                        <span>Facebook</span>
                      </a>
                      <a
                        href="https://www.instagram.com/jump.with.jenny/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rb-social-pill"
                      >
                        <FaInstagram aria-hidden="true" />
                        <span>Instagram</span>
                      </a>
                      <a
                        href="https://www.tiktok.com/@jump.with.jenny"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rb-social-pill"
                      >
                        <FaTiktok aria-hidden="true" />
                        <span>TikTok</span>
                      </a>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 10. FOOTER */}
      <footer className="rb-footer">
        <div className="rb-wrap rb-footer__inner">
          <div className="rb-footer__brand">
            <img
              src={isLightHeader ? '/brand_logo.png' : '/images/brand_logo_light.png'}
              alt=""
              aria-hidden="true"
              width="34"
              height="34"
            />
            <span>
              &copy; {new Date().getFullYear()} {t('footer.copyright')}
            </span>
          </div>

          <div className="rb-footer__legal">
            <Link to="/data-deletion">{t('footer.dataDeletion')}</Link>
            <a
              href="https://www.iubenda.com/privacy-policy/60706541/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('footer.cookiePolicy')}
            </a>
            <a
              href="https://www.iubenda.com/privacy-policy/60706541"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('footer.privacyPolicy')}
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Theme Switcher Dock */}
      <aside className="rb-switcher-dock" aria-label={DEMO_COPY.switcherTitle}>
        <div className="rb-switcher-dock__pills" role="group" aria-label={DEMO_COPY.switcherTitle}>
          {THEMES.map((item) => {
            const isActive = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                className={`rb-switcher-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => handleSelectTheme(item.id)}
                title={item.hint}
              >
                <span className="rb-switcher-btn__dots" aria-hidden="true">
                  {item.swatches.map((hex) => (
                    <span key={hex} style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span className="rb-switcher-btn__label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <Link to="/" className="rb-switcher-dock__back">
          {DEMO_COPY.backToLive}
        </Link>
      </aside>

      {/* Gallery Lightbox */}
      {isLightboxOpen && activeLightboxItem && (
        <div className="rb-lightbox" onClick={closeLightbox}>
          <div
            ref={lightboxRef}
            className="rb-lightbox__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={DEMO_COPY.galleryTitle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="rb-lightbox__close"
              aria-label={t('altitude.gallery.closeLightbox')}
              onClick={closeLightbox}
            >
              <FaTimes aria-hidden="true" />
            </button>

            <img
              src={activeLightboxItem.src}
              alt={activeLightboxItem.caption}
              className="rb-lightbox__img"
            />

            <div className="rb-lightbox__bar">
              <button
                type="button"
                className="rb-lightbox__nav"
                aria-label={t('galleryPrevSlide')}
                onClick={() =>
                  setLightboxIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)
                }
              >
                <FaChevronLeft aria-hidden="true" />
              </button>
              <span className="tabular-nums">
                {t('altitude.gallery.counter', {
                  current: (lightboxIndex % galleryItems.length) + 1,
                  total: galleryItems.length,
                })}
              </span>
              <button
                type="button"
                className="rb-lightbox__nav"
                aria-label={t('galleryNextSlide')}
                onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryItems.length)}
              >
                <FaChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Booking Modal */}
      <DemoBookingModal
        isOpen={Boolean(selectedModalWorkout)}
        onClose={() => setModalWorkoutId(null)}
        workout={selectedModalWorkout}
        concept={activeThemeMeta.modalConcept}
        lang="bg"
        copy={COPY.bg}
        isBookedByUser={Boolean(selectedModalWorkout && demoBookings[selectedModalWorkout.Id])}
        userBookingInfo={selectedModalWorkout ? demoBookings[selectedModalWorkout.Id] : null}
        onBookSuccess={handleBookSuccess}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
};

export default ReboundDemo;
