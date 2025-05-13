import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkoutService from '../../../services/WorkoutSevices';
import './AdminWorkouts.scss';

const WorkoutForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState({
    Day: 'Monday',
    Time: '09:00',
    Status: 'Available',
    AvailableSpots: 20,
    WorkoutShoes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      const fetchWorkout = async () => {
        try {
          const data = await WorkoutService.getWorkoutById(id);
          setWorkout(data);
        } catch (err) {
          setError(err.message || 'Failed to load workout');
        }
      };
      fetchWorkout();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkout(prev => ({ ...prev, [name]: value }));
  };

  const handleShoeChange = (index, field, value) => {
    const newShoes = [...workout.WorkoutShoes];
    newShoes[index][field] = value;
    setWorkout({ ...workout, WorkoutShoes: newShoes });
  };

  const addShoe = () => {
    setWorkout({
      ...workout,
      WorkoutShoes: [...workout.WorkoutShoes, {
        ShoeId: '',
        Size: '',
        IsTaken: false
      }]
    });
  };

  const removeShoe = (index) => {
    const newShoes = workout.WorkoutShoes.filter((_, i) => i !== index);
    setWorkout({ ...workout, WorkoutShoes: newShoes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await WorkoutService.updateWorkout(id, workout);
        setSuccessMessage('Workout updated successfully');
      } else {
        await WorkoutService.createWorkout(workout);
        setSuccessMessage('Workout created successfully');
      }
      setTimeout(() => navigate('/admin/workouts'), 2000);
    } catch (error) {
      setError(error.message || 'Failed to save workout');
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
            <select
              name="Day"
              value={workout.Day}
              onChange={handleChange}
              required
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              name="Time"
              value={workout.Time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              name="Status"
              value={workout.Status}
              onChange={handleChange}
            >
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
              min="1"
              max="50"
              value={workout.AvailableSpots}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="shoes-section">
          {workout.WorkoutShoes.map((shoe, index) => (
            <div key={index} className="shoe-input">
              <input
                type="text"
                placeholder="Shoe ID"
                value={shoe.ShoeId}
                onChange={(e) => handleShoeChange(index, 'ShoeId', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Size"
                min="1"
                max="50"
                value={shoe.Size}
                onChange={(e) => handleShoeChange(index, 'Size', e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => removeShoe(index)}
                className="btn-remove"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addShoe} className="btn-add-shoe">
            + Add Member
          </button>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn-save"
          >
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
    </div>
  );
};

export default WorkoutForm;