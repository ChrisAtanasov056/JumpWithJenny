import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleWorkouts, formatShortDate } from '../../hooks/useScheduleWorkouts';
import WorkoutModal from '../WorkoutModal/WorkoutModal';
import './Schedule.scss';

const SHOE_SIZE_DEFS = [
  { key: 'S', sizeId: 1, label: 'S 36-38' },
  { key: 'M', sizeId: 2, label: 'M 39-41' },
  { key: 'L', sizeId: 3, label: 'L 42-44' },
  { key: 'XL', sizeId: 4, label: 'XL 44-46' },
];

const ALTITUDE_LEVELS = [120, 240, 360];
const STAGGER_OFFSETS = [44, 0, 76];
const PARALLAX_SPEEDS = [0.05, 0.1, 0.04];

const getAvailableSizesMap = (workout) => {
  const counts = { S: 0, M: 0, L: 0, XL: 0 };
  if (!Array.isArray(workout?.WorkoutShoes)) return counts;

  workout.WorkoutShoes.forEach((ws) => {
    if (!ws.IsTaken && ws.Shoe) {
      switch (ws.Shoe.Size) {
        case 1: counts.S += 1; break;
        case 2: counts.M += 1; break;
        case 3: counts.L += 1; break;
        case 4: counts.XL += 1; break;
        default: break;
      }
    }
  });

  return counts;
};

const ScheduleContent = ({ state }) => {
  const { t, i18n } = useTranslation();
  const {
    workouts,
    weekGroups,
    myBookings,
    loading,
    error,
    isRegistering,
    registerForWorkout,
    clearStaleToken,
    handleBookingCancelled,
  } = state;

  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const cloudRefs = useRef(new Map());
  const innerRefs = useRef(new Map());

  const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];

  const resolvedWeekKey = useMemo(() => {
    if (selectedWeekKey === 'all' && weekGroups.length > 1) {
      return 'all';
    }
    if (selectedWeekKey && weekGroups.some((g) => g.key === selectedWeekKey)) {
      return selectedWeekKey;
    }
    return weekGroups[0]?.key || null;
  }, [selectedWeekKey, weekGroups]);

  const visibleWorkouts = useMemo(() => {
    if (!resolvedWeekKey || resolvedWeekKey === 'all') {
      return workouts;
    }
    return weekGroups.find((g) => g.key === resolvedWeekKey)?.workouts || workouts;
  }, [resolvedWeekKey, weekGroups, workouts]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = null;

    const updateParallax = () => {
      rafId = null;
      const isCompact = window.innerWidth <= 860;
      const halfHeight = window.innerHeight / 2;

      cloudRefs.current.forEach((node) => {
        if (!node) return;
        if (prefersReducedMotion || isCompact) {
          node.style.transform = '';
          return;
        }
        const speed = Number(node.dataset.speed) || 0;
        const rect = node.getBoundingClientRect();
        const offset = (rect.top - halfHeight) * -speed;
        node.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [visibleWorkouts]);

  const setCloudRef = useCallback((id) => (node) => {
    if (node) {
      cloudRefs.current.set(id, node);
    } else {
      cloudRefs.current.delete(id);
    }
  }, []);

  const setInnerRef = useCallback((id) => (node) => {
    if (node) {
      innerRefs.current.set(id, node);
    } else {
      innerRefs.current.delete(id);
    }
  }, []);

  const openModal = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
  };

  const handleRegistration = async (workout, bookingData) => {
    const updatedWorkout = await registerForWorkout(workout, bookingData);
    setSelectedWorkout(updatedWorkout);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const innerEl = innerRefs.current.get(workout.Id);
    if (innerEl && !prefersReducedMotion && typeof innerEl.animate === 'function') {
      innerEl.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
        { duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
      );
    }

    return updatedWorkout;
  };

  return (
    <section id="schedule" className="alt-section schedule-section" aria-labelledby="schedule-title">
      <div className="alt-wrap">
        <div className="schedule-header">
          <h2 id="schedule-title" className="alt-section-title">
            {t('schedule.title')}
          </h2>
        </div>

        {loading && (
          <div className="schedule-status" role="status">
            {t('schedule.loading')}
          </div>
        )}

        {!loading && error && (
          <div className="schedule-status schedule-status--error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && workouts.length === 0 && (
          <p className="schedule-empty">{t('schedule.noWorkouts')}</p>
        )}

        {!loading && !error && workouts.length > 0 && (
          <>
            {weekGroups.length > 0 && (
              <div
                className="schedule-week-tabs"
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
                      className={`schedule-week-tab ${isActive ? 'is-active' : ''}`}
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
                    className={`schedule-week-tab ${resolvedWeekKey === 'all' ? 'is-active' : ''}`}
                    onClick={() => setSelectedWeekKey('all')}
                  >
                    <strong>{t('altitude.schedule.allWorkouts', { count: workouts.length })}</strong>
                    <span>{t('altitude.schedule.allSubtitle')}</span>
                  </button>
                )}
              </div>
            )}

            <div className={`schedule-clouds ${visibleWorkouts.length === 1 ? 'is-single' : ''}`}>
              {visibleWorkouts.map((workout, idx) => {
                const status = workout?.Status?.toLowerCase();
                const isBookedByMe = Boolean(workout?.Id && myBookings[workout.Id]?.token);
                const availableSpots = Math.max(0, workout?.AvailableSpots ?? 0);
                const takenSpots = Math.max(0, workout?.TakenSpots ?? 0);
                const maxSpots = Math.max(
                  1,
                  workout?.TotalSpots || availableSpots + takenSpots || 10
                );
                const isAvailable = status === 'available' && availableSpots > 0;
                const canOpenModal = isAvailable || isBookedByMe;

                const translatedDay = workout?.Day
                  ? t(`days.${workout.Day.toLowerCase()}`, { defaultValue: workout.Day })
                  : '';
                const shortDate = formatShortDate(workout.Date, activeLang);
                const shoeCounts = getAvailableSizesMap(workout);
                const hasAnyBootsFree = Object.values(shoeCounts).some((count) => count > 0);
                const altitudeMeters = ALTITUDE_LEVELS[idx % ALTITUDE_LEVELS.length];
                const staggerY = visibleWorkouts.length === 1 ? 0 : STAGGER_OFFSETS[idx % STAGGER_OFFSETS.length];
                const speed = PARALLAX_SPEEDS[idx % PARALLAX_SPEEDS.length];
                const fillRatio = Math.max(0, Math.min(1, availableSpots / maxSpots));

                const buttonLabel = isBookedByMe
                  ? t('altitude.schedule.manageBookingBtn')
                  : isAvailable
                    ? isRegistering[workout.Id]
                      ? t('schedule.registering')
                      : t('altitude.schedule.bookBtn')
                    : t('altitude.schedule.fullClassBtn');

                return (
                  <article
                    key={workout.Id || `${workout.Date}-${workout.Time}`}
                    ref={setCloudRef(workout.Id)}
                    data-speed={speed}
                    className={`schedule-cloud ${isBookedByMe ? 'is-booked' : ''}`}
                    style={{ '--cloud-y': `${staggerY}px` }}
                  >
                    <div className="schedule-cloud__inner" ref={setInnerRef(workout.Id)}>
                      <div className="schedule-cloud__glass">
                        <div className="schedule-cloud__top">
                          <span className="schedule-cloud__date">{shortDate}</span>
                          {isBookedByMe ? (
                            <span className="schedule-cloud__tag schedule-cloud__tag--booked">
                              {t('schedule.registeredBadge')}
                            </span>
                          ) : (
                            <span className="schedule-cloud__tag">
                              {t('altitude.schedule.altitudeMeters', { meters: altitudeMeters })}
                            </span>
                          )}
                        </div>

                        <h3 className="schedule-cloud__day">{translatedDay}</h3>
                        <b className="schedule-cloud__time">{workout.Time}</b>

                        {maxSpots <= 12 ? (
                          <div className="schedule-cloud__segments" aria-hidden="true">
                            {Array.from({ length: maxSpots }, (_, segIdx) => (
                              <i
                                key={segIdx}
                                className={`seg ${segIdx < maxSpots - availableSpots ? 'is-taken' : ''}`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="schedule-cloud__bar" aria-hidden="true">
                            <span style={{ transform: `scaleX(${fillRatio})` }} />
                          </div>
                        )}

                        <p className="schedule-cloud__spots">
                          {t('altitude.schedule.spotsOfMax', {
                            available: availableSpots,
                            max: maxSpots,
                          })}
                        </p>

                        <div className="schedule-cloud__sizes">
                          {SHOE_SIZE_DEFS.map((sz) => {
                            const freeCount = shoeCounts[sz.key] || 0;
                            return (
                              <span key={sz.key} className={freeCount === 0 ? 'is-gone' : ''}>
                                {sz.label}
                              </span>
                            );
                          })}
                        </div>

                        {!hasAnyBootsFree && isAvailable && (
                          <p className="schedule-cloud__own-only">
                            {t('altitude.schedule.ownShoesOnlyTag')}
                          </p>
                        )}

                        <button
                          type="button"
                          className={`schedule-cloud__btn ${isBookedByMe ? 'is-manage' : ''}`}
                          disabled={!canOpenModal}
                          onClick={() => canOpenModal && openModal(workout)}
                        >
                          {buttonLabel}
                        </button>
                      </div>

                      <svg
                        className="schedule-cloud__outline"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M 4,96 C 1,96 0,90 0,82 L 0,28 C 0,16 9,11 21,14 C 28,2 54,-1 65,10 C 77,5 98,11 100,26 L 100,82 C 100,90 99,96 96,96 Z"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.52)"
                          strokeWidth="1.5"
                          vectorEffect="nonScalingStroke"
                        />
                      </svg>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedWorkout={selectedWorkout}
        onRegister={handleRegistration}
        savedCancellationToken={
          selectedWorkout?.Id ? myBookings[selectedWorkout.Id]?.token : null
        }
        onClearStaleToken={clearStaleToken}
        onBookingCancelled={handleBookingCancelled}
      />
    </section>
  );
};

const StandaloneSchedule = () => {
  const state = useScheduleWorkouts();
  return <ScheduleContent state={state} />;
};

const Schedule = ({ externalState }) => {
  if (externalState) {
    return <ScheduleContent state={externalState} />;
  }
  return <StandaloneSchedule />;
};

export default Schedule;
