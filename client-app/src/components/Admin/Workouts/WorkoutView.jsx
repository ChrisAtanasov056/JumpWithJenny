import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkoutService from '../../../services/WorkoutSevices';
import './WorkoutView.scss';

// Static label maps
const shoeSizeLabels = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const WorkoutView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState({
    workout: null,
    participants: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const [workoutData, participantsData] = await Promise.all([
          WorkoutService.getWorkoutById(id),
          WorkoutService.getWorkoutParticipants(id),
        ]);
        setData({
          workout: workoutData,
          participants: Array.isArray(participantsData) ? participantsData : [],
          loading: false,
          error: null,
        });
      } catch (err) {
        setData({
          workout: null,
          participants: [],
          loading: false,
          error: err.message || t('admin.workouts.view.loadError'),
        });
      }
    };

    fetchWorkout();
  }, [id, t]);

  const { workout, participants, loading, error } = data;

  if (loading) {
    return <div className="loading">{t('admin.workouts.view.loading')}</div>;
  }

  if (error) {
    return <div className="error">{t('admin.common.errorPrefix')} {error}</div>;
  }

  if (!workout) {
    return <div className="error">{t('admin.workouts.view.notFound')}</div>;
  }

  const translatedDay = workout.Day
    ? t(`days.${workout.Day.toLowerCase()}`, { defaultValue: workout.Day })
    : '';
  const translatedStatus = workout.Status
    ? t(`admin.workouts.statuses.${workout.Status.toLowerCase()}`, { defaultValue: workout.Status })
    : '';

  const sortedShoes = [...(workout.WorkoutShoes || [])].sort(
    (a, b) => (Number(a.Shoe?.Size) || 0) - (Number(b.Shoe?.Size) || 0)
  );

  const clientList = participants.length > 0
    ? participants
    : (workout.Appointments || []).map((a) => ({
        Id: a.Id,
        FullName: a.UserFullName,
        Email: a.UserEmail,
        PhoneNumber: a.PhoneNumber,
        ShoeSize: a.ShoeSize,
        UsesOwnShoes: a.UsesOwnShoes,
      }));

  return (
    <div className="workout-view">
      <div className="header">
        <h2>
          {t('admin.workouts.view.heading', { day: translatedDay, time: workout.Time })}
        </h2>
        <Link to="/admin/workouts" className="btn-back">
          {t('admin.workouts.view.backToWorkouts')}
        </Link>
      </div>

      <div className="workout-details">
        <div className="details-section">
          <h3>{t('admin.workouts.view.infoTitle')}</h3>
          <div className="detail-item">
            <span className="label">{t('admin.workouts.table.status')}:</span>
            <span className={`status-badge ${workout.Status.toLowerCase()}`}>
              {translatedStatus}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">{t('admin.workouts.table.availableSpots')}:</span>
            <span>{workout.AvailableSpots}</span>
          </div>
          <div className="detail-item">
            <span className="label">{t('admin.workouts.view.shoesAvailable')}</span>
            <div className="shoes-list">
              {sortedShoes.length > 0 ? (
                sortedShoes.map((shoe) => (
                  <div key={shoe.Id} className="shoe-item">
                    <span className="size">
                      {t('admin.workouts.view.shoeSize')} {shoeSizeLabels[Number(shoe.Shoe?.Size)] || t('admin.common.notAvailable')}
                    </span>
                    <span className={`status ${shoe.IsTaken ? 'taken' : 'available'}`}>
                      {shoe.IsTaken ? t('admin.workouts.view.shoeTaken') : t('admin.workouts.view.shoeFree')}
                    </span>
                  </div>
                ))
              ) : (
                <p>{t('admin.workouts.view.noShoes')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Registered Clients Section */}
        <div className="clients-section">
          <h3>{t('admin.workouts.view.registeredClients')}</h3>
          {clientList.length > 0 ? (
            <div className="clients-list">
              {clientList.map((participant) => (
                <div key={participant.Id} className="client-card">
                  <div className="client-info">
                    <h4>{participant.FullName}</h4>
                    <p>{t('admin.workouts.view.email')} {participant.Email}</p>
                    <p>
                      {t('admin.workouts.view.phone')}{' '}
                      {participant.PhoneNumber ? (
                        <a href={`tel:${participant.PhoneNumber.replace(/\s+/g, '')}`} className="phone-link">
                          {participant.PhoneNumber}
                        </a>
                      ) : (
                        t('admin.common.notAvailable')
                      )}
                    </p>
                  </div>
                  <div className="shoe-info">
                    <span className="label">{t('admin.workouts.view.shoe')}</span>
                    {participant.UsesOwnShoes ? (
                      <span>{t('admin.workouts.view.ownShoes')}</span>
                    ) : (
                      <span>
                        {shoeSizeLabels[Number(participant.ShoeSize)] || t('admin.workouts.view.notAssigned')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-clients">
              {t('admin.workouts.view.noClients')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutView;
