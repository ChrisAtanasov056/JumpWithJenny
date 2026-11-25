import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api/axius';
import { parseWorkoutDate, WORKOUT_TIME_ZONE } from '../utils/workoutDate';
import { loadMyBookings, saveMyBooking, removeMyBooking } from '../utils/bookingStorage';

const getSofiaDayParts = (dateValue) => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WORKOUT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
};

const getSofiaMondayKey = (dateValue) => {
  const parts = getSofiaDayParts(dateValue);
  if (!parts) return 'unknown';

  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayOfWeek = utcDate.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  return utcDate.toISOString().slice(0, 10);
};

const addDaysToIsoKey = (isoKey, days) => {
  const date = new Date(`${isoKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const formatShortDate = (dateValue, lang = 'bg') => {
  const parsed = parseWorkoutDate(dateValue);
  if (!parsed) return '';
  const locale = String(lang).startsWith('en') ? 'en-US' : 'bg-BG';
  return new Intl.DateTimeFormat(locale, {
    timeZone: WORKOUT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }).format(parsed);
};

export const groupWorkoutsByCalendarWeek = (workouts, lang = 'bg') => {
  if (!Array.isArray(workouts) || workouts.length === 0) return [];

  const thisWeekKey = getSofiaMondayKey(new Date());
  const nextWeekKey = addDaysToIsoKey(thisWeekKey, 7);

  const map = new Map();
  workouts.forEach((workout) => {
    const key = getSofiaMondayKey(workout.Date);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(workout);
  });

  return Array.from(map.entries()).map(([key, items]) => {
    const firstDate = formatShortDate(items[0]?.Date, lang);
    const lastDate = formatShortDate(items[items.length - 1]?.Date, lang);
    const rangeText = firstDate && lastDate && firstDate !== lastDate
      ? `${firstDate} – ${lastDate}`
      : firstDate || lastDate || '';

    let labelType = 'range';
    if (key === thisWeekKey) {
      labelType = 'thisWeek';
    } else if (key === nextWeekKey) {
      labelType = 'nextWeek';
    }

    return {
      key,
      labelType,
      rangeText,
      workouts: items,
    };
  });
};

export const useScheduleWorkouts = () => {
  const { t, i18n } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [myBookings, setMyBookings] = useState(() => loadMyBookings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState({});

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/Schedule');
      const now = new Date();
      const rows = Array.isArray(response.data) ? response.data : [];
      const upcoming = rows
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

  const registerForWorkout = useCallback(
    async (workout, bookingData) => {
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
    },
    [fetchWorkouts, i18n.language, i18n.resolvedLanguage]
  );

  const clearStaleToken = useCallback((workoutId) => {
    removeMyBooking(workoutId);
    setMyBookings(loadMyBookings());
  }, []);

  const handleBookingCancelled = useCallback(
    async (workoutId) => {
      removeMyBooking(workoutId);
      setMyBookings(loadMyBookings());
      await fetchWorkouts();
    },
    [fetchWorkouts]
  );

  const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];
  const weekGroups = useMemo(
    () => groupWorkoutsByCalendarWeek(workouts, activeLang),
    [workouts, activeLang]
  );

  return {
    workouts,
    weekGroups,
    myBookings,
    loading,
    error,
    isRegistering,
    fetchWorkouts,
    registerForWorkout,
    clearStaleToken,
    handleBookingCancelled,
  };
};
