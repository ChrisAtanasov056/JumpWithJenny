import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import WorkoutService from '../../../services/WorkoutSevices';
import './AdminWorkouts.scss';

const WorkoutView = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await WorkoutService.getWorkoutById(id);
        setWorkout(data);
      } catch (err) {
        setError(err.message || 'Failed to load workout details');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

  if (loading) return <div className="loading">Loading workout details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!workout) return <div className="error">Workout not found</div>;

  return (
    <div className="workout-view">
      <div className="header">
        <h2>{workout.Day} Workout at {workout.Time}</h2>
        <Link to="/admin/workouts" className="btn-back">
          &larr; Back to Workouts
        </Link>
      </div>

      <div className="workout-details">
        <div className="details-section">
          <h3>Workout Information</h3>
          <div className="detail-item">
            <span className="label">Status:</span>
            <span className={`status-badge ${workout.Status.toLowerCase()}`}>
              {workout.Status}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Available Spots:</span>
            <span>{workout.AvailableSpots}</span>
          </div>
          <div className="detail-item">
            <span className="label">Shoes Available:</span>
            <div className="shoes-list">
              {workout.WorkoutShoes?.map(shoe => (
                <div key={shoe.Id} className="shoe-item">
                  <span className="size">Size: {shoe.Shoe?.Size}</span>
                  <span className={`status ${shoe.IsTaken ? 'taken' : 'available'}`}>
                    {shoe.IsTaken ? 'Taken' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="clients-section">
          <h3>Registered Clients</h3>
          {workout.Applications?.length > 0 ? (
            <div className="clients-list">
              {workout.Applications.map(application => (
                <div key={application.Id} className="client-card">
                  <div className="client-info">
                    <h4>{application.User?.FullName}</h4>
                    <p>Email: {application.User?.Email}</p>
                    <p>Phone: {application.User?.PhoneNumber || 'N/A'}</p>
                  </div>
                  <div className="shoe-info">
                    <span className="label">Shoe Size:</span>
                    <span>{application.ShoeSize || 'Not specified'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-clients">
              No clients have registered for this workout yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutView;