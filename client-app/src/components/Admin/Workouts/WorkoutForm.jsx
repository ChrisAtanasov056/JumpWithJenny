import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import WorkoutService from '../../../services/WorkoutSevices';
import {
  getSofiaDateParts,
  getWeekdayNameFromDatePart,
} from '../../../utils/workoutDate';
import './WorkoutForm.scss';

const QUICK_TIMES = ['09:00', '10:00', '14:00', '15:00', '18:00', '19:00', '20:00'];

const WorkoutForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const initialToday = getSofiaDateParts(new Date()).datePart;

  const [datePart, setDatePart] = useState(initialToday);
  const [timePart, setTimePart] = useState('18:00');
  const [status, setStatus] = useState('Available');
  const [availableSpots, setAvailableSpots] = useState(20);
  const [takenCount, setTakenCount] = useState(0);

  const [initialLoading, setInitialLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchWorkout = async () => {
      setInitialLoading(true);
      try {
        const data = await WorkoutService.getWorkoutById(id);
        const parts = getSofiaDateParts(data.Date);
        setDatePart(parts.datePart || initialToday);
        setTimePart(data.Time || parts.timePart || '18:00');
        setStatus(data.Status || 'Available');
        setAvailableSpots(Number(data.AvailableSpots ?? 0));
        setTakenCount(data.TakenSpots ?? data.Appointments?.length ?? 0);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message;
        setError(msg || t('admin.workouts.loadSingleError'));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchWorkout();
  }, [id, initialToday, t]);

  const derivedDay = getWeekdayNameFromDatePart(datePart);
  const translatedDerivedDay = derivedDay
    ? t(`days.${derivedDay.toLowerCase()}`, { defaultValue: derivedDay })
    : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const normalizedTime = timePart || '18:00';
    const payload = {
      Id: id || undefined,
      Day: derivedDay || 'Monday',
      Time: normalizedTime,
      Date: `${datePart}T${normalizedTime}:00`,
      Status: status,
      AvailableSpots: Number(availableSpots),
    };

    try {
      if (id) {
        await WorkoutService.updateWorkout(id, payload);
        toast.success(t('admin.workouts.updateSuccess'));
        navigate(`/admin/workouts/${id}/view`);
      } else {
        const created = await WorkoutService.createWorkout(payload);
        toast.success(t('admin.workouts.createSuccess'));
        if (created?.Id) {
          navigate(`/admin/workouts/${created.Id}/view`);
        } else {
          navigate('/admin/workouts');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      setError(msg || t('admin.workouts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return <div className="adm-loading" role="status">{t('admin.common.loading')}</div>;
  }

  return (
    <div className="admin-workout-form-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{id ? t('admin.workouts.editTitle') : t('admin.workouts.addTitle')}</h1>
          <p>{t('admin.workouts.formSubtitle')}</p>
        </div>

        <div className="adm-header-actions">
          {id && (
            <Link to={`/admin/workouts/${id}/view`} className="adm-btn adm-btn--navy">
              {t('admin.workouts.manageParticipantsLink', { count: takenCount })}
            </Link>
          )}
          <Link to="/admin/workouts" className="adm-btn adm-btn--secondary">
            {t('admin.common.backToList')}
          </Link>
        </div>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="adm-card workout-form-card">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="workout-date-part">{t('admin.workouts.dateLabel')}</label>
            <input
              id="workout-date-part"
              type="date"
              className="adm-input"
              value={datePart}
              onChange={(e) => setDatePart(e.target.value)}
              required
            />
            <div className="derived-day-pill">
              <span>{t('admin.workouts.autoDayLabel')}</span>
              <strong>{translatedDerivedDay}</strong>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="workout-time-part">{t('admin.workouts.timeLabel')}</label>
            <input
              id="workout-time-part"
              type="time"
              className="adm-input"
              value={timePart}
              onChange={(e) => setTimePart(e.target.value)}
              required
            />
            <div className="quick-times">
              <span className="quick-times-label">{t('admin.workouts.quickTimesLabel')}</span>
              <div className="quick-times-chips">
                {QUICK_TIMES.map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    className={`quick-time-chip tabular-nums${timePart === qt ? ' active' : ''}`}
                    onClick={() => setTimePart(qt)}
                  >
                    {qt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="workout-status">{t('admin.workouts.table.status')}</label>
            <select
              id="workout-status"
              className="adm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['Available', 'Booked', 'Completed', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {t(`admin.workouts.statuses.${s.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="workout-spots">{t('admin.workouts.table.availableSpots')}</label>
            <input
              id="workout-spots"
              type="number"
              className="adm-input"
              min="0"
              max="100"
              value={availableSpots}
              onChange={(e) => setAvailableSpots(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={() => navigate('/admin/workouts')}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            {saving ? t('admin.common.saving') : t('admin.workouts.saveButton')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;
