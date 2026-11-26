import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaSearch,
  FaPlus,
  FaCalendarPlus,
  FaUsers,
  FaCopy,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { formatWorkoutDateBg } from '../../../utils/workoutDate';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import WeeklyScheduleModal from './WeeklyScheduleModal';
import './AdminWorkoutList.scss';

const SHOE_SIZE_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const PAGE_SIZE = 15;

const AdminWorkoutsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [pagedResult, setPagedResult] = useState({
    Items: [],
    Page: 1,
    PageSize: PAGE_SIZE,
    TotalCount: 0,
    TotalPages: 0,
    HasPreviousPage: false,
    HasNextPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const upcomingOnly = tab === 'upcoming' ? true : tab === 'past' ? false : undefined;
      const data = await WorkoutService.getWorkoutsPaged({
        page,
        pageSize: PAGE_SIZE,
        upcomingOnly,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      setPagedResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.workouts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, debouncedSearch, page, t]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDuplicate = async (workout) => {
    setDuplicatingId(workout.Id);
    try {
      await WorkoutService.duplicateWorkout(workout.Id, { daysOffset: 7 });
      toast.success(t('admin.workouts.duplicateSuccess'));
      fetchWorkouts();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      toast.error(msg || t('admin.workouts.duplicateError'));
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await WorkoutService.deleteWorkout(deleteTarget.Id);
      toast.success(t('admin.workouts.deleteSuccess'));
      setDeleteTarget(null);
      fetchWorkouts();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      toast.error(msg || t('admin.workouts.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getTranslatedDay = (day) =>
    day ? t(`days.${day.toLowerCase()}`, { defaultValue: day }) : '';

  const getTranslatedStatus = (status) =>
    status ? t(`admin.workouts.statuses.${status.toLowerCase()}`, { defaultValue: status }) : '';

  const getShoeDemand = (workout) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, own: 0 };
    const appointments = workout.Appointments || [];

    if (appointments.length > 0) {
      for (const a of appointments) {
        if (a.UsesOwnShoes) {
          counts.own += 1;
        } else if (a.ShoeSize && counts[Number(a.ShoeSize)] !== undefined) {
          counts[Number(a.ShoeSize)] += 1;
        }
      }
    } else {
      for (const ws of workout.WorkoutShoes || []) {
        if (ws.IsTaken && ws.Shoe?.Size && counts[Number(ws.Shoe.Size)] !== undefined) {
          counts[Number(ws.Shoe.Size)] += 1;
        }
      }
    }

    return counts;
  };

  const workouts = pagedResult?.Items || [];

  return (
    <div className="admin-workouts-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.workouts.title')}</h1>
          <p>{t('admin.workouts.subtitle')}</p>
        </div>

        <div className="adm-header-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={() => setShowWeeklyModal(true)}
          >
            <FaCalendarPlus aria-hidden="true" /> {t('admin.workouts.weeklyScheduleBtn')}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={() => navigate('/admin/workouts/new')}
          >
            <FaPlus aria-hidden="true" /> {t('admin.workouts.addNew').replace(/^\+\s*/, '')}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="adm-card workouts-toolbar">
        <div className="segmented-tabs" role="tablist" aria-label={t('admin.workouts.title')}>
          {[
            { id: 'upcoming', label: t('admin.workouts.tabs.upcoming') },
            { id: 'past', label: t('admin.workouts.tabs.past') },
            { id: 'all', label: t('admin.workouts.tabs.all') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`seg-tab${tab === item.id ? ' active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="toolbar-controls">
          <div className="adm-search-field">
            <FaSearch className="adm-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="adm-input"
              placeholder={t('admin.workouts.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label={t('admin.workouts.searchAriaLabel')}
            />
          </div>

          <select
            className="adm-select status-select"
            value={statusFilter}
            onChange={handleStatusChange}
            aria-label={t('admin.workouts.statusFilter')}
          >
            <option value="">{t('admin.workouts.allStatuses')}</option>
            {['Available', 'Booked', 'Completed', 'Cancelled'].map((status) => (
              <option key={status} value={status}>
                {getTranslatedStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error">
          {t('admin.common.errorPrefix')} {error}
        </div>
      )}

      {loading ? (
        <div className="adm-loading" role="status">{t('admin.workouts.loading')}</div>
      ) : workouts.length === 0 ? (
        <div className="adm-empty">
          <h3>{t('admin.workouts.noWorkouts')}</h3>
          {(debouncedSearch || statusFilter) && (
            <button
              type="button"
              className="adm-btn adm-btn--secondary"
              onClick={() => {
                setSearchInput('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              {t('admin.common.resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="adm-card workouts-table-card">
            <table className="workouts-table">
              <thead>
                <tr>
                  <th>{t('admin.workouts.table.date')}</th>
                  <th>{t('admin.workouts.table.status')}</th>
                  <th>{t('admin.workouts.table.occupancy')}</th>
                  <th>{t('admin.workouts.table.shoes')}</th>
                  <th>{t('admin.workouts.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((workout) => {
                  const taken = workout.TakenSpots ?? (workout.Appointments?.length || 0);
                  const total = workout.TotalSpots ?? (workout.AvailableSpots + taken);
                  const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
                  const attended = workout.AttendedCount ?? 0;
                  const demand = getShoeDemand(workout);
                  const hasDemand =
                    demand[1] > 0 || demand[2] > 0 || demand[3] > 0 || demand[4] > 0 || demand.own > 0;

                  return (
                    <tr key={workout.Id}>
                      <td>
                        <div className="cell-date">
                          <strong className="tabular-nums">{formatWorkoutDateBg(workout.Date)}</strong>
                          <span>
                            {getTranslatedDay(workout.Day)} · <strong className="tabular-nums">{workout.Time}</strong>
                          </span>
                          {workout.TrainerNote && (
                            <span className="workout-note-chip" title={workout.TrainerNote}>
                              💬 {workout.TrainerNote}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`adm-status-badge ${(workout.Status || '').toLowerCase()}`}>
                          {getTranslatedStatus(workout.Status)}
                        </span>
                      </td>
                      <td>
                        <div className="occupancy-cell">
                          <div className="occupancy-top tabular-nums">
                            <strong>{t('admin.workouts.occupancyRatio', { taken, total })}</strong>
                            <span>{t('admin.workouts.spotsLeft', { count: workout.AvailableSpots })}</span>
                          </div>
                          <div className="occupancy-track">
                            <div className="occupancy-fill" style={{ width: `${pct}%` }} />
                          </div>
                          {attended > 0 && (
                            <span className="attended-note tabular-nums">
                              {t('admin.workouts.attendedShort', { count: attended })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {hasDemand ? (
                          <div className="shoe-demand-chips">
                            {[1, 2, 3, 4].map((size) =>
                              demand[size] > 0 ? (
                                <span key={size} className="demand-chip tabular-nums">
                                  {SHOE_SIZE_LABELS[size]}:{demand[size]}
                                </span>
                              ) : null
                            )}
                            {demand.own > 0 && (
                              <span className="demand-chip demand-chip--own tabular-nums">
                                {t('admin.workouts.ownShoesShort', { count: demand.own })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="no-demand">—</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            to={`/admin/workouts/${workout.Id}/view`}
                            className="adm-btn adm-btn--navy adm-btn--sm"
                          >
                            <FaUsers aria-hidden="true" />{' '}
                            {t('admin.workouts.participantsBtn', { count: taken })}
                          </Link>
                          <button
                            type="button"
                            className="adm-btn adm-btn--secondary adm-btn--sm"
                            onClick={() => handleDuplicate(workout)}
                            disabled={duplicatingId === workout.Id}
                            title={t('admin.workouts.duplicateBtn')}
                          >
                            <FaCopy aria-hidden="true" /> {t('admin.workouts.duplicateBtn')}
                          </button>
                          <Link
                            to={`/admin/workouts/${workout.Id}`}
                            className="adm-btn adm-btn--secondary adm-btn--sm"
                            aria-label={t('admin.common.edit')}
                          >
                            <FaEdit aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            className="adm-btn adm-btn--danger-soft adm-btn--sm"
                            onClick={() => setDeleteTarget(workout)}
                            aria-label={t('admin.common.delete')}
                          >
                            <FaTrashAlt aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="workouts-mobile-list">
            {workouts.map((workout) => {
              const taken = workout.TakenSpots ?? (workout.Appointments?.length || 0);
              const total = workout.TotalSpots ?? (workout.AvailableSpots + taken);
              const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
              const demand = getShoeDemand(workout);

              return (
                <div key={workout.Id} className="adm-card workout-mobile-card">
                  <div className="mobile-card-top">
                    <div>
                      <strong className="tabular-nums">
                        {getTranslatedDay(workout.Day)}, {formatWorkoutDateBg(workout.Date)}
                      </strong>
                      <div className="mobile-time tabular-nums">{workout.Time}</div>
                      {workout.TrainerNote && (
                        <div className="workout-note-chip" title={workout.TrainerNote}>
                          💬 {workout.TrainerNote}
                        </div>
                      )}
                    </div>
                    <span className={`adm-status-badge ${(workout.Status || '').toLowerCase()}`}>
                      {getTranslatedStatus(workout.Status)}
                    </span>
                  </div>

                  <div className="occupancy-cell">
                    <div className="occupancy-top tabular-nums">
                      <strong>{t('admin.workouts.occupancyRatio', { taken, total })}</strong>
                      <span>{t('admin.workouts.spotsLeft', { count: workout.AvailableSpots })}</span>
                    </div>
                    <div className="occupancy-track">
                      <div className="occupancy-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="shoe-demand-chips">
                    {[1, 2, 3, 4].map((size) =>
                      demand[size] > 0 ? (
                        <span key={size} className="demand-chip tabular-nums">
                          {SHOE_SIZE_LABELS[size]}:{demand[size]}
                        </span>
                      ) : null
                    )}
                    {demand.own > 0 && (
                      <span className="demand-chip demand-chip--own tabular-nums">
                        {t('admin.workouts.ownShoesShort', { count: demand.own })}
                      </span>
                    )}
                  </div>

                  <div className="mobile-card-actions">
                    <Link
                      to={`/admin/workouts/${workout.Id}/view`}
                      className="adm-btn adm-btn--navy adm-btn--sm"
                    >
                      <FaUsers aria-hidden="true" />{' '}
                      {t('admin.workouts.participantsBtn', { count: taken })}
                    </Link>
                    <button
                      type="button"
                      className="adm-btn adm-btn--secondary adm-btn--sm"
                      onClick={() => handleDuplicate(workout)}
                      disabled={duplicatingId === workout.Id}
                    >
                      <FaCopy aria-hidden="true" /> {t('admin.workouts.duplicateBtn')}
                    </button>
                    <Link
                      to={`/admin/workouts/${workout.Id}`}
                      className="adm-btn adm-btn--secondary adm-btn--sm"
                      aria-label={t('admin.common.edit')}
                    >
                      <FaEdit aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="adm-btn adm-btn--danger-soft adm-btn--sm"
                      onClick={() => setDeleteTarget(workout)}
                      aria-label={t('admin.common.delete')}
                    >
                      <FaTrashAlt aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagedResult.TotalPages > 1 && (
            <div className="adm-pagination">
              <span className="tabular-nums">
                {t('admin.common.pageInfo', {
                  page: pagedResult.Page,
                  totalPages: pagedResult.TotalPages,
                  totalCount: pagedResult.TotalCount,
                })}
              </span>
              <div className="adm-pagination-controls">
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('admin.common.previousPage')}
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  disabled={!pagedResult.HasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('admin.common.nextPage')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={t('admin.workouts.deleteModal.title')}
        message={
          deleteTarget
            ? t('admin.workouts.deleteModal.prompt', {
                date: formatWorkoutDateBg(deleteTarget.Date),
                time: deleteTarget.Time,
              })
            : ''
        }
        warning={t('admin.workouts.deleteModal.warning')}
        confirmLabel={t('admin.workouts.deleteModal.confirm')}
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />

      <WeeklyScheduleModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        onCreated={fetchWorkouts}
      />
    </div>
  );
};

export default AdminWorkoutsList;
