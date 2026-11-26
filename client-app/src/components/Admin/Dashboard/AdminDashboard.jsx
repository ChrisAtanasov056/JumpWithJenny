import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaUserCheck,
  FaPhone,
  FaShoePrints,
  FaArrowRight,
  FaPlus,
} from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { formatWorkoutDateBg } from '../../../utils/workoutDate';
import './AdminDashboard.scss';

const SHOE_SIZE_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkoutService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.workouts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getTranslatedDay = (day) =>
    day ? t(`days.${day.toLowerCase()}`, { defaultValue: day }) : '';

  const getTranslatedStatus = (status) =>
    status ? t(`admin.workouts.statuses.${status.toLowerCase()}`, { defaultValue: status }) : '';

  if (loading) {
    return <div className="adm-loading" role="status">{t('admin.common.loading')}</div>;
  }

  if (error) {
    return (
      <div className="adm-empty">
        <h3>{t('admin.common.errorPrefix')} {error}</h3>
        <button type="button" className="adm-btn adm-btn--primary" onClick={loadDashboard}>
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  const nextWorkout = dashboard?.NextWorkout;
  const nextTaken = nextWorkout?.TakenSpots ?? 0;
  const nextTotal = nextWorkout?.TotalSpots ?? 0;
  const nextPct = nextTotal > 0 ? Math.min(100, Math.round((nextTaken / nextTotal) * 100)) : 0;

  return (
    <div className="admin-dashboard">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.dashboard.title')}</h1>
          <p>{t('admin.dashboard.subtitle')}</p>
        </div>
        <div className="adm-header-actions">
          <Link to="/admin/workouts/new" className="adm-btn adm-btn--primary">
            <FaPlus aria-hidden="true" /> {t('admin.workouts.addNew').replace(/^\+\s*/, '')}
          </Link>
        </div>
      </div>

      {/* Hero: Next Workout Readiness */}
      <section className="adm-card hero-workout-card">
        {nextWorkout ? (
          <>
            <div className="hero-top">
              <div className="hero-meta">
                <span className="hero-eyebrow">{t('admin.dashboard.nextWorkoutTitle')}</span>
                <h2>
                  {getTranslatedDay(nextWorkout.Day)}, {formatWorkoutDateBg(nextWorkout.Date)} ·{' '}
                  <span className="tabular-nums">{nextWorkout.Time}</span>
                </h2>
                {nextWorkout.TrainerNote && (
                  <div className="hero-note-pill">
                    <span aria-hidden="true">💬</span>
                    <span>{nextWorkout.TrainerNote}</span>
                  </div>
                )}
                <div className="hero-badges">
                  <span className={`adm-status-badge ${(nextWorkout.Status || '').toLowerCase()}`}>
                    {getTranslatedStatus(nextWorkout.Status)}
                  </span>
                  <span className="hero-occupancy-text tabular-nums">
                    {t('admin.dashboard.bookedSpots', { taken: nextTaken, total: nextTotal })}
                  </span>
                  <span className="hero-spots-left tabular-nums">
                    ({t('admin.workouts.spotsLeft', { count: nextWorkout.AvailableSpots })})
                  </span>
                </div>
              </div>

              <div className="hero-actions">
                <Link to={`/admin/workouts/${nextWorkout.Id}/view`} className="adm-btn adm-btn--primary">
                  {t('admin.dashboard.openWorkoutBtn')} <FaArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="occupancy-bar" aria-hidden="true">
              <div className="occupancy-fill" style={{ width: `${nextPct}%` }} />
            </div>

            <div className="shoe-prep-strip">
              <span className="prep-label">
                <FaShoePrints aria-hidden="true" /> {t('admin.dashboard.prepareShoesTitle')}:
              </span>
              <div className="prep-chips">
                {(dashboard?.NextWorkoutShoePrep || []).map((item) => (
                  <div key={item.Size} className="prep-chip tabular-nums">
                    <span className="prep-size">{SHOE_SIZE_LABELS[Number(item.Size)] || '?'}</span>
                    <span className="prep-count">
                      {item.BookedCount} / {item.TotalCount}
                    </span>
                  </div>
                ))}
                <div className="prep-chip prep-chip--own tabular-nums">
                  {t('admin.dashboard.ownShoesCount', { count: dashboard?.NextWorkoutOwnShoesCount ?? 0 })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hero-empty">
            <div>
              <h2>{t('admin.dashboard.nextWorkoutTitle')}</h2>
              <p>{t('admin.dashboard.noNextWorkout')}</p>
            </div>
            <Link to="/admin/workouts/new" className="adm-btn adm-btn--primary">
              {t('admin.dashboard.createWorkoutCta')}
            </Link>
          </div>
        )}
      </section>

      {/* KPI Row */}
      <section className="kpi-grid">
        <div className="adm-card kpi-card">
          <div className="kpi-icon kpi-icon--navy"><FaCalendarAlt aria-hidden="true" /></div>
          <div className="kpi-body">
            <span className="kpi-label">{t('admin.dashboard.kpiWeekWorkouts')}</span>
            <strong className="kpi-value tabular-nums">{dashboard?.ThisWeekWorkoutsCount ?? 0}</strong>
          </div>
        </div>
        <div className="adm-card kpi-card">
          <div className="kpi-icon kpi-icon--coral"><FaUserCheck aria-hidden="true" /></div>
          <div className="kpi-body">
            <span className="kpi-label">{t('admin.dashboard.kpiWeekBookings')}</span>
            <strong className="kpi-value tabular-nums">{dashboard?.ThisWeekBookingsCount ?? 0}</strong>
          </div>
        </div>
        <div className="adm-card kpi-card">
          <div className="kpi-icon kpi-icon--emerald"><FaChartLine aria-hidden="true" /></div>
          <div className="kpi-body">
            <span className="kpi-label">{t('admin.dashboard.kpiOccupancy')}</span>
            <strong className="kpi-value tabular-nums">{dashboard?.OccupancyRatePercent ?? 0}%</strong>
          </div>
        </div>
        <div className="adm-card kpi-card">
          <div className="kpi-icon kpi-icon--amber"><FaUsers aria-hidden="true" /></div>
          <div className="kpi-body">
            <span className="kpi-label">{t('admin.dashboard.kpiClients')}</span>
            <strong className="kpi-value tabular-nums">{dashboard?.TotalUniqueClients ?? 0}</strong>
          </div>
        </div>
      </section>

      {/* Main 2-column Grid */}
      <div className="dashboard-columns">
        <section className="adm-card dash-panel">
          <div className="panel-header">
            <h3>{t('admin.dashboard.upcomingListTitle')}</h3>
            <Link to="/admin/workouts" className="panel-link">
              {t('admin.dashboard.viewAllWorkouts')}
            </Link>
          </div>
          {(dashboard?.UpcomingWorkoutsPreview || []).length > 0 ? (
            <div className="upcoming-list">
              {dashboard.UpcomingWorkoutsPreview.map((w) => (
                <Link key={w.Id} to={`/admin/workouts/${w.Id}/view`} className="upcoming-row">
                  <div className="upcoming-date">
                    <strong className="tabular-nums">{formatWorkoutDateBg(w.Date)}</strong>
                    <span>
                      {getTranslatedDay(w.Day)} · <span className="tabular-nums">{w.Time}</span>
                    </span>
                  </div>
                  <div className="upcoming-right">
                    <span className="tabular-nums spots-pill">
                      {w.TakenSpots} / {w.TotalSpots}
                    </span>
                    <span className={`adm-status-badge ${(w.Status || '').toLowerCase()}`}>
                      {getTranslatedStatus(w.Status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="panel-empty">{t('admin.dashboard.noNextWorkout')}</p>
          )}
        </section>

        <section className="adm-card dash-panel">
          <div className="panel-header">
            <h3>{t('admin.dashboard.recentBookingsTitle')}</h3>
            <Link to="/admin/clients" className="panel-link">
              {t('admin.sidebar.clients')}
            </Link>
          </div>
          {(dashboard?.RecentBookings || []).length > 0 ? (
            <div className="recent-list">
              {dashboard.RecentBookings.map((b) => (
                <div key={b.AppointmentId} className="recent-row">
                  <div className="recent-main">
                    <Link to={`/admin/workouts/${b.WorkoutId}/view`} className="recent-name">
                      {b.FullName}
                    </Link>
                    <span className="recent-meta">
                      {getTranslatedDay(b.WorkoutDay)} · {formatWorkoutDateBg(b.WorkoutDate)} ({b.WorkoutTime})
                    </span>
                  </div>
                  <div className="recent-right">
                    <span className="shoe-tag">
                      {b.UsesOwnShoes
                        ? t('admin.clients.ownShoes')
                        : (SHOE_SIZE_LABELS[Number(b.ShoeSize)] || '—')}
                    </span>
                    {b.PhoneNumber && (
                      <a
                        href={`tel:${b.PhoneNumber.replace(/\s+/g, '')}`}
                        className="phone-chip"
                        aria-label={b.PhoneNumber}
                      >
                        <FaPhone aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">{t('admin.dashboard.noRecentBookings')}</p>
          )}
        </section>
      </div>

      {/* Studio Boot Inventory Strip */}
      <section className="adm-card dash-panel shoes-strip-panel">
        <div className="panel-header">
          <div>
            <h3>{t('admin.dashboard.shoesOverviewTitle')}</h3>
            <p className="panel-subtitle">
              {t('admin.dashboard.totalShoesLabel', { count: dashboard?.TotalShoesCount ?? 0 })}
            </p>
          </div>
          <Link to="/admin/shoes" className="panel-link">
            {t('admin.dashboard.viewAllShoes')}
          </Link>
        </div>

        <div className="shoes-mini-grid">
          {(dashboard?.ShoesSummary || []).map((s) => (
            <div key={s.Size} className="shoe-mini-card">
              <div className="shoe-mini-top">
                <span className="shoe-mini-size">{SHOE_SIZE_LABELS[Number(s.Size)] || '?'}</span>
                <strong className="tabular-nums">{s.TotalCount}</strong>
              </div>
              <span className="shoe-mini-sub tabular-nums">
                {t('admin.shoes.reservedUpcoming')}: {s.ReservedUpcomingCount}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
