import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShoeService from '../../../services/ShoeService';
import './ShoeDetails.scss';

const ShoeDetailsView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(err.message || t('admin.shoes.details.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchShoe();
  }, [id, t]);

  if (loading) return <div className="loading">{t('admin.shoes.details.loading')}</div>;
  if (error) return <div className="error">{t('admin.common.errorPrefix')} {error}</div>;
  if (!shoe) return <div className="not-found">{t('admin.shoes.details.notFound')}</div>;

  return (
    <div className="shoe-details-container">
      <div className="shoe-details-card">
        <h2>{t('admin.shoes.details.title')}</h2>
        <div className="details-section">
          <p><strong>{t('admin.shoes.table.id')}:</strong> {shoe.Id}</p>
          <p><strong>{t('admin.shoes.table.size')}:</strong> {shoeSizeLabels[Number(shoe.Size)] || t('admin.common.notAvailable')}</p>
        </div>

        {/* Users */}
        <div className="details-section">
          <h3>{t('admin.shoes.details.associatedUsers')}</h3>
          {shoe.Users && shoe.Users.length > 0 ? (
            <ul>
              {shoe.Users.map(user => (
                <li key={user.Id}>{t('admin.shoes.details.userId')} {user.Id}</li>
              ))}
            </ul>
          ) : (
            <p>{t('admin.shoes.details.noUsers')}</p>
          )}
        </div>

        {/* Workouts */}
        <div className="details-section">
          <h3>{t('admin.shoes.details.associatedWorkouts')}</h3>
          {shoe.Workouts && shoe.Workouts.length > 0 ? (
            <ul>
              {shoe.Workouts.map(workout => (
                <li key={workout.Id}>{t('admin.shoes.details.workoutId')} {workout.Id}</li>
              ))}
            </ul>
          ) : (
            <p>{t('admin.shoes.details.noWorkouts')}</p>
          )}
        </div>

        <button className="btn-back" onClick={() => navigate(-1)}>
          {t('admin.common.backToList')}
        </button>
      </div>
    </div>
  );
};

export default ShoeDetailsView;
