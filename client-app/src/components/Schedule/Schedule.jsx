import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../api/axius';
import WorkoutModal from '../WorkoutModal/WorkoutModal';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import { parseWorkoutDate } from '../../utils/workoutDate';
import { loadMyBookings, saveMyBooking, removeMyBooking } from '../../utils/bookingStorage';
import './Schedule.scss';

const parseTimeToMinutes = (timeStr = '') => {
  const [hours, minutes] = String(timeStr).split(':').map(Number);
  return (Number.isFinite(hours) ? hours * 60 : 0) + (Number.isFinite(minutes) ? minutes : 0);
};

const Schedule = () => {
  const { t, i18n } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [myBookings, setMyBookings] = useState(() => loadMyBookings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/Schedule');
      const now = new Date();
      const upcoming = response.data
        .filter((w) => {
          const parsedDate = parseWorkoutDate(w.Date);
          return parsedDate && parsedDate > now;
        })
        .sort((a, b) => parseWorkoutDate(a.Date) - parseWorkoutDate(b.Date));
      setWorkouts(upcoming);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError(t('schedule.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const openModal = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
  };

  const handleRegistration = async (workout, bookingData) => {
    setIsRegistering((prev) => ({ ...prev, [workout.Id]: true }));

    try {
      const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];
      const payload = {
        workoutId: workout.Id,
        fullName: bookingData.fullName,
        email: bookingData.email,
        phoneNumber: bookingData.phoneNumber,
        shoeSize: bookingData.usesOwnShoes ? null : bookingData.shoeSize,
        usesOwnShoes: bookingData.usesOwnShoes,
        language: activeLang === 'en' ? 'en' : 'bg',
      };

      const response = await axios.post('/api/Schedule/apply', payload);

      if (response.status === 200) {
        const updatedWorkout = response.data?.workout || response.data;
        const cancellationToken = response.data?.cancellationToken;

        if (cancellationToken) {
          saveMyBooking(workout.Id, cancellationToken);
          setMyBookings(loadMyBookings());
        }

        setWorkouts((prev) =>
          prev.map((w) => (w.Id === updatedWorkout.Id ? updatedWorkout : w))
        );
        setSelectedWorkout(updatedWorkout);
        return updatedWorkout;
      }
    } catch (err) {
      console.error('Error registering for workout:', err);
      if (err.response?.status === 409) {
        await fetchWorkouts();
      }
      throw err;
    } finally {
      setIsRegistering((prev) => ({ ...prev, [workout.Id]: false }));
    }
  };

  const handleClearStaleToken = useCallback((workoutId) => {
    removeMyBooking(workoutId);
    setMyBookings(loadMyBookings());
  }, []);

  const handleBookingCancelled = useCallback(async (workoutId) => {
    removeMyBooking(workoutId);
    setMyBookings(loadMyBookings());
    await fetchWorkouts();
  }, [fetchWorkouts]);

  const groupedWorkouts = useMemo(() => {
    return workouts.reduce((acc, workout) => {
      const { Day } = workout;
      if (!acc[Day]) acc[Day] = [];
      acc[Day].push(workout);
      return acc;
    }, {});
  }, [workouts]);

  const dynamicTimes = useMemo(() => {
    return Array.from(new Set(workouts.map((w) => w.Time).filter(Boolean))).sort(
      (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
    );
  }, [workouts]);

  const daysOfWeek = [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday'),
  ];

  const dayKeys = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  return (
    <section id="schedule" className="schedule-section" aria-labelledby="schedule-title">
      <div className="schedule-container">
        <h2 id="schedule-title">{t('schedule.title')}</h2>

        {loading && <div className="schedule-status loading" role="status">{t('schedule.loading')}</div>}
        {!loading && error && <div className="schedule-status error" role="alert">{error}</div>}
        {!loading && !error && workouts.length === 0 && (
          <p className="schedule-empty">{t('schedule.noWorkouts')}</p>
        )}

        {!loading && !error && workouts.length > 0 && !isMobile && (
          <div className="desktop-schedule">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">{t('schedule.time')}</th>
                  {daysOfWeek.map((day, idx) => (
                    <th scope="col" key={dayKeys[idx]}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dynamicTimes.map((time) => (
                  <tr key={time}>
                    <th scope="row" className="time-header">{time}</th>
                    {dayKeys.map((dayKey, dayIdx) => {
                      const workout = groupedWorkouts[dayKey]?.find((w) => w.Time === time);
                      const status = workout?.Status?.toLowerCase();
                      const isBookedByMe = Boolean(workout?.Id && myBookings[workout.Id]?.token);
                      const canOpenModal = status === 'available' || isBookedByMe;

                      const statusText = isBookedByMe
                        ? t('schedule.registeredBadge')
                        : status === 'available'
                          ? isRegistering[workout?.Id]
                            ? t('schedule.registering')
                            : t('schedule.available')
                          : status === 'booked'
                            ? t('schedule.booked')
                            : '';

                      return (
                        <td
                          key={`${dayKey}-${time}`}
                          className={`schedule-cell ${status || 'empty'} ${isBookedByMe ? 'registered-by-me' : ''} ${canOpenModal ? 'clickable' : ''}`}
                        >
                          {canOpenModal ? (
                            <button
                              type="button"
                              className="schedule-slot-btn"
                              onClick={() => openModal(workout)}
                              aria-label={`${daysOfWeek[dayIdx]} ${time} - ${statusText}`}
                            >
                              {statusText}
                            </button>
                          ) : (
                            statusText
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && workouts.length > 0 && isMobile && (
          <div className="mobile-schedule">
            {dayKeys.map((dayKey, index) => {
              const dayWorkouts = [...(groupedWorkouts[dayKey] || [])].sort(
                (a, b) => parseTimeToMinutes(a.Time) - parseTimeToMinutes(b.Time)
              );
              const translatedDay = daysOfWeek[index];

              if (dayWorkouts.length === 0) return null;

              return (
                <div key={dayKey} className="day-column">
                  <h3 className="day-header">{translatedDay}</h3>
                  {dayWorkouts.map((workout) => {
                    const status = workout?.Status?.toLowerCase();
                    const isBookedByMe = Boolean(workout?.Id && myBookings[workout.Id]?.token);
                    const canOpenModal = status === 'available' || isBookedByMe;

                    const statusText = isBookedByMe
                      ? t('schedule.registeredBadge')
                      : status === 'available'
                        ? isRegistering[workout?.Id]
                          ? t('schedule.registering')
                          : t('schedule.available')
                        : status === 'booked'
                          ? t('schedule.booked')
                          : '';

                    if (canOpenModal) {
                      return (
                        <button
                          key={workout.Id || `${dayKey}-${workout.Time}`}
                          type="button"
                          className={`time-slot ${status || 'empty'} ${isBookedByMe ? 'registered-by-me' : ''} clickable`}
                          onClick={() => openModal(workout)}
                        >
                          <span>{workout.Time}</span>
                          <span>{statusText}</span>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={workout.Id || `${dayKey}-${workout.Time}`}
                        className={`time-slot ${status || 'empty'}`}
                      >
                        <span>{workout.Time}</span>
                        <span>{statusText}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedWorkout={selectedWorkout}
        onRegister={handleRegistration}
        savedCancellationToken={selectedWorkout ? myBookings[selectedWorkout.Id]?.token : null}
        onClearStaleToken={handleClearStaleToken}
        onBookingCancelled={handleBookingCancelled}
      />
    </section>
  );
};

export default Schedule;
