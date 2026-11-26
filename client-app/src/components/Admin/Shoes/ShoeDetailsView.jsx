import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShoeService from '../../../services/ShoeService';
import { formatWorkoutDateBg } from '../../../utils/workoutDate';
import './ShoeDetails.scss';

const SHOE_SIZE_LABELS = {
  1: 'S (EU 36–38)',
  2: 'M (EU 39–41)',
  3: 'L (EU 42–44)',
  4: 'XL (EU 44–46)',
};

const ShoeDetailsView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShoe = async () => {
      try {
        const response = await ShoeService.getShoeById(id);
        setShoe(response);
      } catch (err) {
        setError(err?.message || t('admin.shoes.details.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchShoe();
  }, [id, t]);

  if (loading) return <div className="adm-loading" role="status">{t('admin.shoes.details.loading')}</div>;
  if (error) return <div className="adm-alert adm-alert--error">{t('admin.common.errorPrefix')} {error}</div>;
  if (!shoe) return <div className="adm-empty"><h3>{t('admin.shoes.details.notFound')}</h3></div>;

  return (
    <div className="shoe-details-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.shoes.details.title')}</h1>
          <p>{SHOE_SIZE_LABELS[Number(shoe.Size)] || t('admin.common.notAvailable')}</p>
        </div>
        <button type="button" className="adm-btn adm-btn--secondary" onClick={() => navigate('/admin/shoes')}>
          {t('admin.common.backToList')}
        </button>
      </div>

      <div className="shoe-details-grid">
        <section className="adm-card detail-panel">
          <h3>{t('admin.shoes.details.associatedWorkouts')}</h3>
          {shoe.Workouts && shoe.Workouts.length > 0 ? (
            <div className="linked-list">
              {shoe.Workouts.map((workout) => (
                <Link
                  key={workout.Id}
                  to={`/admin/workouts/${workout.Id}/view`}
                  className="linked-item"
                >
                  <strong className="tabular-nums">{formatWorkoutDateBg(workout.Date)}</strong>
                  <span>
                    {workout.Day ? t(`days.${workout.Day.toLowerCase()}`, { defaultValue: workout.Day }) : ''} · {workout.Time}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted-copy">{t('admin.shoes.details.noWorkouts')}</p>
          )}
        </section>

        <section className="adm-card detail-panel">
          <h3>{t('admin.shoes.details.associatedUsers')}</h3>
          {shoe.Users && shoe.Users.length > 0 ? (
            <ul className="users-list">
              {shoe.Users.map((user) => (
                <li key={user.Id}>{user.Username || user.Id}</li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">{t('admin.shoes.details.noUsers')}</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ShoeDetailsView;
