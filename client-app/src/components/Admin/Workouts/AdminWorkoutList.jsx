import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { parseWorkoutDate, formatWorkoutDateBg } from '../../../utils/workoutDate';
import './AdminWorkoutList.scss';

const AdminWorkoutsList = () => {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      setError(null);
      try {
        const responseData = await WorkoutService.getAllWorkouts({ upcomingOnly: !showPast });
        const data = Array.isArray(responseData) ? responseData : (responseData?.Items || []);
        const now = new Date();

        const filtered = data
          .filter(w => {
            const workoutDate = parseWorkoutDate(w.Date);
            return showPast
              ? (!workoutDate || workoutDate <= now)
              : Boolean(workoutDate && workoutDate > now);
          })
          .sort((a, b) => {
            const timeA = parseWorkoutDate(a.Date)?.getTime() ?? 0;
            const timeB = parseWorkoutDate(b.Date)?.getTime() ?? 0;
            return showPast ? timeB - timeA : timeA - timeB;
          });

        setWorkouts(filtered);
      } catch (err) {
        setError(err.message || t('admin.workouts.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [showPast, t]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.workouts.deleteConfirm'))) return;

    try {
      await WorkoutService.deleteWorkout(id);
      setWorkouts(workouts.filter(workout => workout.Id !== id));
      setSuccessMessage(t('admin.workouts.deleteSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.message || t('admin.workouts.deleteError'));
    }
  };

  const getTranslatedDay = (day) => {
    if (!day) return '';
    return t(`days.${day.toLowerCase()}`, { defaultValue: day });
  };

  const getTranslatedStatus = (status) => {
    if (!status) return '';
    return t(`admin.workouts.statuses.${status.toLowerCase()}`, { defaultValue: status });
  };

  const filteredWorkouts = workouts.filter(workout => {
    const search = searchTerm.toLowerCase();
    return (
      (workout.Day || '').toLowerCase().includes(search) ||
      getTranslatedDay(workout.Day).toLowerCase().includes(search) ||
      (workout.Time || '').toLowerCase().includes(search)
    );
  });

  if (loading) return <div className="loading">{t('admin.workouts.loading')}</div>;
  if (error) return <div className="error">{t('admin.common.errorPrefix')} {error}</div>;

  return (
    <div className="admin-workouts">
      <div className="header">
        <h2>{t('admin.workouts.title')}</h2>
        <div className="actions">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.workouts.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('admin.workouts.searchAriaLabel')}
            />
            <FaSearch className="search-icon" aria-hidden="true" />
          </div>
          <button
            className="btn-add"
            onClick={() => navigate('/admin/workouts/new')}
          >
            {t('admin.workouts.addNew')}
          </button>
        </div>
      </div>

      <div className="view-switch">
        <label className="switch">
          <input type="checkbox" checked={showPast} onChange={() => setShowPast(!showPast)} />
          <span className="slider round"></span>
        </label>
        <span>{showPast ? t('admin.workouts.pastWorkouts') : t('admin.workouts.upcomingWorkouts')}</span>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      {isMobile ? (
        <div className="workouts-card-list">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map(workout => (
              <div key={workout.Id} className="workout-card">
                <div className="info-row">
                  <span className="info-label">{t('admin.workouts.table.date')}:</span>
                  <span>{formatWorkoutDateBg(workout.Date)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('admin.workouts.table.day')}:</span>
                  <span>{getTranslatedDay(workout.Day)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('admin.workouts.table.time')}:</span>
                  <span>{workout.Time}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('admin.workouts.table.status')}:</span>
                  <span>
                    <span className={`status-badge ${workout.Status.toLowerCase()}`}>
                      {getTranslatedStatus(workout.Status)}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">{t('admin.workouts.table.availableSpots')}:</span>
                  <span>{workout.AvailableSpots}</span>
                </div>
                <div className="actions">
                  <Link to={`/admin/workouts/${workout.Id}/view`} className="btn-view">
                    {t('admin.common.view')}
                  </Link>
                  <Link to={`/admin/workouts/${workout.Id}`} className="btn-edit">
                    {t('admin.common.edit')}
                  </Link>
                  <button className="btn-delete" onClick={() => handleDelete(workout.Id)}>
                    {t('admin.common.delete')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">{t('admin.workouts.noWorkouts')}</div>
          )}
        </div>
      ) : (
        <div className="workouts-table">
          <table>
            <thead>
              <tr>
                <th>{t('admin.workouts.table.date')}</th>
                <th>{t('admin.workouts.table.day')}</th>
                <th>{t('admin.workouts.table.time')}</th>
                <th>{t('admin.workouts.table.status')}</th>
                <th>{t('admin.workouts.table.availableSpots')}</th>
                <th>{t('admin.workouts.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkouts.length > 0 ? (
                filteredWorkouts.map(workout => (
                  <tr key={workout.Id}>
                    <td>{formatWorkoutDateBg(workout.Date)}</td>
                    <td>{getTranslatedDay(workout.Day)}</td>
                    <td>{workout.Time}</td>
                    <td>
                      <span className={`status-badge ${workout.Status.toLowerCase()}`}>
                        {getTranslatedStatus(workout.Status)}
                      </span>
                    </td>
                    <td>{workout.AvailableSpots}</td>
                    <td className="actions">
                      <Link to={`/admin/workouts/${workout.Id}/view`} className="btn-view">
                        {t('admin.common.view')}
                      </Link>
                      <Link to={`/admin/workouts/${workout.Id}`} className="btn-edit">
                        {t('admin.common.edit')}
                      </Link>
                      <button className="btn-delete" onClick={() => handleDelete(workout.Id)}>
                        {t('admin.common.delete')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-results">
                    {t('admin.workouts.noWorkouts')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWorkoutsList;