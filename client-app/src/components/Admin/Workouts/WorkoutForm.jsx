import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkoutService from '../../../services/WorkoutSevices';
import AddUserSearchModal from './AddUserSearchModal';
import { formatWorkoutDateForInput } from '../../../utils/workoutDate';
import './WorkoutForm.scss';

const shoeSizeLabels = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const WorkoutForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState({
    Day: 'Monday',
    Time: '09:00',
    Date: '',
    Status: 'Available',
    AvailableSpots: 20,
    Appointments: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const addParticipant = async (participant) => {
    const updatedWorkout = await WorkoutService.addParticipantToWorkout(id, participant);
    setWorkout({
      ...updatedWorkout,
      Date: formatWorkoutDateForInput(updatedWorkout.Date),
    });
  };

  const removeParticipant = async (appointmentId) => {
    try {
      await WorkoutService.removeParticipantFromWorkout(appointmentId);
      const refreshed = await WorkoutService.getWorkoutById(id);
      setWorkout({
        ...refreshed,
        Date: formatWorkoutDateForInput(refreshed.Date),
      });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || t('admin.workouts.removeParticipantError'));
    }
  };

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await WorkoutService.getWorkoutById(id);
        setWorkout({
          ...data,
          Date: formatWorkoutDateForInput(data.Date),
        });
      } catch (err) {
        const serverMessage = err.response?.data?.message || err.message;
        setError(serverMessage || t('admin.workouts.loadSingleError'));
      }
    };

    if (id) fetchWorkout();
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkout((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    const payload = {
      ...workout,
      AvailableSpots: Number(workout.AvailableSpots),
    };

    try {
      if (id) {
        await WorkoutService.updateWorkout(id, payload);
        setSuccessMessage(t('admin.workouts.updateSuccess'));
      } else {
        await WorkoutService.createWorkout(payload);
        setSuccessMessage(t('admin.workouts.createSuccess'));
      }
      setTimeout(() => navigate('/admin/workouts'), 2000);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || t('admin.workouts.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workout-form">
      <h2>{id ? t('admin.workouts.editTitle') : t('admin.workouts.addTitle')}</h2>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workout-day">{t('admin.workouts.table.day')}</label>
            <select id="workout-day" name="Day" value={workout.Day} onChange={handleChange} required>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <option key={day} value={day}>{t(`days.${day.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="workout-time">{t('admin.workouts.table.time')}</label>
            <input id="workout-time" type="time" name="Time" value={workout.Time} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workout-date">{t('admin.workouts.dateTime')}</label>
            <input
              id="workout-date"
              type="datetime-local"
              name="Date"
              value={workout.Date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workout-status">{t('admin.workouts.table.status')}</label>
            <select id="workout-status" name="Status" value={workout.Status} onChange={handleChange}>
              {['Available', 'Booked', 'Completed', 'Cancelled'].map((status) => (
                <option key={status} value={status}>{t(`admin.workouts.statuses.${status.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="workout-spots">{t('admin.workouts.table.availableSpots')}</label>
            <input
              id="workout-spots"
              type="number"
              name="AvailableSpots"
              min="0"
              max="50"
              value={workout.AvailableSpots}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {id && (
          <div className="participants-section">
            <h3>{t('admin.workouts.participants')}</h3>
            {workout.Appointments?.length === 0 && <p>{t('admin.workouts.noParticipants')}</p>}

            {workout.Appointments?.map((appointment) => {
              const shoeText = appointment.UsesOwnShoes
                ? t('admin.workouts.view.ownShoes')
                : (shoeSizeLabels[Number(appointment.ShoeSize)] || t('admin.workouts.view.notAssigned'));

              return (
                <div key={appointment.Id} className="participant-display">
                  <span>
                    {appointment.UserFullName} ({appointment.UserEmail}{appointment.PhoneNumber ? ` · ${appointment.PhoneNumber}` : ''}) — {shoeText}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeParticipant(appointment.Id)}
                    className="btn-remove"
                    aria-label={t('admin.workouts.removeParticipantAria')}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <div className="add-participant">
              <button
                type="button"
                onClick={() => setShowUserSearch(true)}
                className="btn-add-participant"
              >
                {t('admin.workouts.addParticipant')}
              </button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-save">
            {loading ? t('admin.common.saving') : t('admin.workouts.saveButton')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/workouts')}
            className="btn-cancel"
          >
            {t('admin.common.cancel')}
          </button>
        </div>
      </form>
      <AddUserSearchModal
        visible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onConfirm={addParticipant}
      />
    </div>
  );
};

export default WorkoutForm;
