import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ShoeService from '../../../services/ShoeService';
import './ShoeDetails.scss';

const ShoeDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUserId, setNewUserId] = useState("");

  const shoeSizeLabels = {
    1: 'S',
    2: 'M',
    3: 'L',
    4: 'XL',
  };

  useEffect(() => {
    const fetchShoe = async () => {
      try {
        const response = await ShoeService.getShoeById(id);
        setShoe(response);
      } catch (err) {
        setError(err.message || 'Failed to load shoe details');
      } finally {
        setLoading(false);
      }
    };
    fetchShoe();
  }, [id]);

  // Добавяне на потребител към state (и по желание -> към бекенда)
  const handleAddUser = async () => {
    if (!newUserId.trim()) return;

    try {
      // по избор: извикваш бекенд service за добавяне
      await ShoeService.addUserToShoe(shoe.Id, newUserId);

      // локално обновяване на state
      setShoe(prev => ({
        ...prev,
        Users: [...prev.Users, { Id: newUserId }]
      }));

      setNewUserId("");
    } catch (err) {
      alert("Error adding user: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading shoe details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!shoe) return <div className="not-found">Shoe not found.</div>;

  return (
    <div className="shoe-details-container">
      <div className="shoe-details-card">
        <h2>Shoe Details</h2>
        <div className="details-section">
          <p><strong>ID:</strong> {shoe.Id}</p>
          <p><strong>Size:</strong> {shoeSizeLabels[Number(shoe.Size)] || 'N/A'}</p>
        </div>

        {/* Users */}
        <div className="details-section">
          <h3>Associated Users</h3>
          {shoe.Users && shoe.Users.length > 0 ? (
            <ul>
              {shoe.Users.map(user => (
                <li key={user.Id}>User ID: {user.Id}</li>
              ))}
            </ul>
          ) : (
            <p>No users associated with this shoe.</p>
          )}
        </div>

        {/* Workouts */}
        <div className="details-section">
          <h3>Associated Workouts</h3>
          {shoe.Workouts && shoe.Workouts.length > 0 ? (
            <ul>
              {shoe.Workouts.map(workout => (
                <li key={workout.Id}>Workout ID: {workout.Id}</li>
              ))}
            </ul>
          ) : (
            <p>No workouts associated with this shoe.</p>
          )}
        </div>

        <button className="btn-back" onClick={() => navigate(-1)}>
          Back to List
        </button>
      </div>
    </div>
  );
};

export default ShoeDetailsView;
