import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../services/AuthContext';
import WorkoutModal from '../WorkoutModal/WorkoutModal';
import './Schedule.scss';

const Schedule = () => {
  const { isAuthenticated, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://localhost:7024/api/Schedule');
        setWorkouts(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkout(null);
  };

  const handleRegistration = async (workout, shoeSize, cardType, usesOwnShoes) => {
    if (!isAuthenticated) {
      alert('You need to be logged in to register for a workout.');
      return;
    }

    setIsRegistering((prev) => ({ ...prev, [workout.id]: true }));

    try {
      const payload = {
        workoutId: workout.Id,  // Changed to match your request structure
        shoeSize: shoeSize,     // Changed to camelCase
        cardType: cardType,     // Changed to camelCase
        userId: user.id,        // Changed to camelCase
        usesOwnShoes: usesOwnShoes // Changed to camelCase
      };

      const response = await axios.post(
        'https://localhost:7024/api/Schedule/apply',
        payload
      );

      if (response.status === 200) {
        const updatedWorkout = response.data;
        
        setWorkouts((prevWorkouts) =>
          prevWorkouts.map((w) => (w.Id === updatedWorkout.Id ? updatedWorkout : w))
        );
        closeModal();
      }
    } catch (error) {
      console.error('Error registering for workout:', error);
      alert(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsRegistering((prev) => ({ ...prev, [workout.id]: false }));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const { Day } = workout;
    if (!acc[Day]) acc[Day] = [];
    acc[Day].push(workout);
    return acc;
  }, {});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <section id="schedule" className="schedule-section">
      <div className="schedule-container">
        <h2>Weekly Schedule</h2>
        <div className="desktop-schedule">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Time</th>
                {daysOfWeek.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((time) => (
                <tr key={time}>
                  <td>{time}</td>
                  {daysOfWeek.map((day) => {
                    const workout = groupedWorkouts[day]?.find((w) => w.Time === time);
                    const status = workout?.Status.toLowerCase();
                    return (
                      <td
                        key={`${day}-${time}`}
                        className={`schedule-cell ${status || 'empty'}`}
                        onClick={() => status === 'available' && openModal(workout)}
                      >
                        {status === 'available' && (isRegistering[workout?.id] ? 'Registering...' : 'Available')}
                        {status === 'booked' && 'Booked'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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