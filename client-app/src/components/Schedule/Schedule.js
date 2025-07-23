import React, { useState, useEffect } from 'react';
import axios from '../../api/axius'; // axios инстанция с базов URL
import { useAuth } from '../../services/AuthContext';
import WorkoutModal from '../WorkoutModal/WorkoutModal';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import './Schedule.scss';

const Schedule = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Зареждане на тренировки (филтриране само за бъдещи)
  const fetchWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/Schedule'); // базов URL е в axios инстанцията
      const now = new Date();
      const upcoming = response.data
        .filter(w => w.Date && new Date(w.Date) > now)
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));
      setWorkouts(upcoming);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError(t('schedule.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [t]);

  // Отваряне и затваряне на модалния прозорец
  const openModal = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
  };

  // Регистрация за тренировка
  const handleRegistration = async (workout, shoeSize, cardType, usesOwnShoes) => {
    if (!isAuthenticated) {
      alert(t('schedule.loginRequired'));
      return;
    }

    setIsRegistering(prev => ({ ...prev, [workout.Id]: true }));

    try {
      const payload = {
        workoutId: workout.Id,
        shoeSize,
        cardType,
        userId: user.id,
        usesOwnShoes,
      };

      const response = await axios.post('/Schedule/apply', payload);

      if (response.status === 200) {
        const updatedWorkout = response.data;
        setWorkouts(prev =>
          prev.map(w => (w.Id === updatedWorkout.Id ? updatedWorkout : w))
        );
        closeModal();
      }
    } catch (err) {
      console.error('Error registering for workout:', err);
      alert(err.response?.data?.message || t('schedule.registerFailed'));
    } finally {
      setIsRegistering(prev => ({ ...prev, [workout.Id]: false }));
    }
  };

  if (loading) return <div className="loading">{t('schedule.loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  // Групиране по ден от седмицата
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const { Day } = workout;
    if (!acc[Day]) acc[Day] = [];
    acc[Day].push(workout);
    return acc;
  }, {});

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
    <section id="schedule" className="schedule-section">
      <div className="schedule-container">
        <h2>{t('schedule.title')}</h2>

        {!isMobile && (
          <div className="desktop-schedule">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>{t('schedule.time')}</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={idx}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(time => (
                  <tr key={time}>
                    <td>{time}</td>
                    {dayKeys.map(dayKey => {
                      const workout = groupedWorkouts[dayKey]?.find(w => w.Time === time);
                      const status = workout?.Status?.toLowerCase();

                      return (
                        <td
                          key={`${dayKey}-${time}`}
                          className={`schedule-cell ${status || 'empty'}`}
                          onClick={() => status === 'available' && openModal(workout)}
                        >
                          {status === 'available' &&
                            (isRegistering[workout?.Id] ? t('schedule.registering') : t('schedule.available'))}
                          {status === 'booked' && t('schedule.booked')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isMobile && (
          <div className="mobile-schedule">
            {dayKeys.map((dayKey, index) => {
              const dayWorkouts = groupedWorkouts[dayKey] || [];
              const translatedDay = daysOfWeek[index];

              if (dayWorkouts.length === 0) return null;

              return (
                <div key={dayKey} className="day-column">
                  <h3 className="day-header">{translatedDay}</h3>
                  {dayWorkouts.map(workout => {
                    const status = workout?.Status?.toLowerCase();
                    return (
                      <div
                        key={`${dayKey}-${workout.Time}`}
                        className={`time-slot ${status || 'empty'}`}
                        onClick={() => status === 'available' && openModal(workout)}
                      >
                        <span>{workout.Time}</span>
                        <span>
                          {status === 'available' &&
                            (isRegistering[workout?.Id] ? t('schedule.registering') : t('schedule.available'))}
                          {status === 'booked' && t('schedule.booked')}
                        </span>
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
        isLoggedIn={isAuthenticated}
      />
    </section>
  );
};

export default Schedule;
