import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkoutService from '../../../services/WorkoutSevices';
import AddUserSearchModal from './AddUserSearchModal';
import './WorkoutForm.scss';

const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  return String(dateValue).slice(0, 16);
};

const WorkoutForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState({
    Day: 'Monday',
    Time: '09:00',
    Date: '',
    Status: 'Available',
    AvailableSpots: 20,
    Appointments: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  const searchUsers = useCallback(async (query) => {
    try {
      return await WorkoutService.searchUsers(query);
    } catch (err) {
      console.error('User search failed', err);
      return [];
    }
  }, []);

  const addParticipant = async (participant) => {
    const { userId, shoeSize, cardType, usesOwnShoes } = participant;
    const updatedWorkout = await WorkoutService.addParticipantToWorkout(
      id,
      userId,
      shoeSize,
      cardType,
      usesOwnShoes
    );
    setWorkout({
      ...updatedWorkout,
      Date: formatDateForInput(updatedWorkout.Date),
    });
  };

  const removeParticipant = async (participantId) => {
    try {
      await WorkoutService.removeParticipantFromWorkout(id, participantId);
      const refreshed = await WorkoutService.getWorkoutById(id);
      setWorkout({
        ...refreshed,
        Date: formatDateForInput(refreshed.Date),
      });
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || 'Failed to remove participant');
    }
  };

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await WorkoutService.getWorkoutById(id);
        setWorkout({
          ...data,
          Date: formatDateForInput(data.Date),
        });
      } catch (err) {
        const serverMessage = err.response?.data?.message || err.message;
        setError(serverMessage || 'Failed to load workout');
      }
    };

    if (id) fetchWorkout();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkout(prev => ({ ...prev, [name]: value }));
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
        setSuccessMessage('Workout updated successfully');
      } else {
        await WorkoutService.createWorkout(payload);
        setSuccessMessage('Workout created successfully');
      }
      setTimeout(() => navigate('/admin/workouts'), 2000);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || 'Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workout-form">
      <h2>{id ? 'Edit Workout' : 'Add New Workout'}</h2>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Day</label>
            <select name="Day" value={workout.Day} onChange={handleChange} required>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Time</label>
            <input type="time" name="Time" value={workout.Time} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date & Time</label>
            <input
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
            <label>Status</label>
            <select name="Status" value={workout.Status} onChange={handleChange}>
              {['Available', 'Booked', 'Completed', 'Cancelled'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Available Spots</label>
            <input
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
            <h3>Participants</h3>
            {workout.Appointments?.length === 0 && <p>No participants yet.</p>}

            {workout.Appointments?.map((appointment) => (
              <div key={appointment.Id || appointment.UserId} className="participant-display">
                <span>{appointment.UserFullName} ({appointment.UserEmail})</span>
                <button
                  type="button"
                  onClick={() => removeParticipant(appointment.UserId)}
                  className="btn-remove"
                >
                  ×
                </button>
              </div>
            ))}

            <div className="add-participant">
              <button
                type="button"
                onClick={() => setShowUserSearch(true)}
                className="btn-add-participant"
              >
                + Add Participant
              </button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-save">
            {loading ? 'Saving...' : 'Save Workout'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/workouts')}
            className="btn-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
      <AddUserSearchModal
        visible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onConfirm={addParticipant}
        searchUsers={searchUsers}
      />
    </div>
  );
};

export default WorkoutForm;
