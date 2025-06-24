import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WorkoutService from '../../../services/WorkoutSevices';
import './AdminWorkoutList.scss';

const AdminWorkoutsList = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPast, setShowPast] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const data = await WorkoutService.getAllWorkouts();
        const now = new Date();

        const filtered = data
          .filter(w => w.Date)
          .filter(w => {
            const workoutDate = new Date(w.Date);
            return showPast ? workoutDate <= now : workoutDate > now;
          })
          .sort((a, b) => new Date(a.Date) - new Date(b.Date));

        setWorkouts(filtered);
      } catch (err) {
        setError(err.message || 'Failed to load workouts');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [showPast]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;

    try {
      await WorkoutService.deleteWorkout(id);
      setWorkouts(workouts.filter(workout => workout.Id !== id));
      setSuccessMessage('Workout deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete workout');
    }
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.Day.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.Time.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading workouts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="admin-workouts">
      <div className="header">
        <h2>Workout Management</h2>
        <div className="actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search workouts"
            />
            <i className="search-icon">🔍</i>
          </div>
          <button
            className="btn-add"
            onClick={() => navigate('/admin/workouts/new')}
          >
            + Add New Workout
          </button>
        </div>
      </div>

      <div className="view-switch">
        <label className="switch">
          <input type="checkbox" checked={showPast} onChange={() => setShowPast(!showPast)} />
          <span className="slider round"></span>
        </label>
        <span>{showPast ? 'Изминали тренировки' : 'Текущи тренировки'}</span>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      <div className="workouts-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Time</th>
              <th>Status</th>
              <th>Available Spots</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkouts.length > 0 ? (
              filteredWorkouts.map(workout => (
                <tr key={workout.Id}>
                  <td>{new Date(workout.Date).toLocaleDateString('bg-BG')}</td>
                  <td>{workout.Day}</td>
                  <td>{workout.Time}</td>
                  <td>
                    <span className={`status-badge ${workout.Status.toLowerCase()}`}>
                      {workout.Status}
                    </span>
                  </td>
                  <td>{workout.AvailableSpots}</td>
                  <td className="actions">
                    <Link to={`/admin/workouts/${workout.Id}/view`} className="btn-view">
                      View
                    </Link>
                    <Link to={`/admin/workouts/${workout.Id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button className="btn-delete" onClick={() => handleDelete(workout.Id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No workouts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminWorkoutsList;
