import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaCheck,
  FaEdit,
  FaTrashAlt,
  FaCopy,
  FaPrint,
  FaPhone,
  FaEnvelope,
  FaSearch,
  FaShoePrints,
} from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { formatWorkoutDateBg, getSofiaDateParts } from '../../../utils/workoutDate';
import AdminConfirmModal from '../shared/AdminConfirmModal';
import ParticipantFormModal from './ParticipantFormModal';
import './WorkoutView.scss';

const SHOE_SIZE_LABELS = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
};

const WorkoutView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [participantSearch, setParticipantSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'attended' | 'pending'

  const [modalState, setModalState] = useState({ open: false, mode: 'add', participant: null });
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const fetchWorkout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const workoutData = await WorkoutService.getWorkoutById(id);
      setWorkout(workoutData);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.workouts.view.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const participants = useMemo(() => workout?.Appointments || [], [workout]);

  const shoeSummary = useMemo(() => {
    const sizes = [1, 2, 3, 4].map((size) => {
      const forSize = (workout?.WorkoutShoes || []).filter(
        (ws) => !ws.IsDeleted && Number(ws.Shoe?.Size) === size
      );
      const total = forSize.length;
      const taken = forSize.filter((ws) => ws.IsTaken).length;
      return {
        size,
        label: SHOE_SIZE_LABELS[size],
        total,
        taken,
        free: Math.max(0, total - taken),
      };
    });

    const ownCount = participants.filter((p) => p.UsesOwnShoes).length;
    return { sizes, ownCount };
  }, [workout, participants]);

  const filteredParticipants = useMemo(() => {
    const term = participantSearch.trim().toLowerCase();
    return participants.filter((p) => {
      if (attendanceFilter === 'attended' && !p.IsAttended) return false;
      if (attendanceFilter === 'pending' && p.IsAttended) return false;

      if (!term) return true;
      return (
        (p.UserFullName || '').toLowerCase().includes(term) ||
        (p.PhoneNumber || '').toLowerCase().includes(term) ||
        (p.UserEmail || '').toLowerCase().includes(term)
      );
    });
  }, [participants, participantSearch, attendanceFilter]);

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    if (!workout || nextStatus === workout.Status) return;

    setUpdatingStatus(true);
    try {
      const parts = getSofiaDateParts(workout.Date);
      await WorkoutService.updateWorkout(workout.Id, {
        Id: workout.Id,
        Day: workout.Day || parts.dayName,
        Time: workout.Time || parts.timePart,
        Date: `${parts.datePart}T${workout.Time || parts.timePart}:00`,
        Status: nextStatus,
        AvailableSpots: workout.AvailableSpots,
      });
      setWorkout((prev) => (prev ? { ...prev, Status: nextStatus } : prev));
      toast.success(t('admin.workouts.view.statusUpdated'));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      toast.error(msg || t('admin.workouts.view.statusUpdateError'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDuplicate = async () => {
    if (!workout) return;
    setDuplicating(true);
    try {
      const created = await WorkoutService.duplicateWorkout(workout.Id, { daysOffset: 7 });
      toast.success(t('admin.workouts.duplicateSuccess'));
      if (created?.Id) {
        navigate(`/admin/workouts/${created.Id}/view`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      toast.error(msg || t('admin.workouts.duplicateError'));
    } finally {
      setDuplicating(false);
    }
  };

  const handleCopyList = async () => {
    if (!workout) return;
    const translatedDay = t(`days.${(workout.Day || '').toLowerCase()}`, {
      defaultValue: workout.Day,
    });
    const header = `${translatedDay}, ${formatWorkoutDateBg(workout.Date)} · ${workout.Time} (${participants.length}/${workout.TotalSpots ?? workout.AvailableSpots + participants.length})`;
    const lines = participants.map((p, idx) => {
      const shoeLabel = p.UsesOwnShoes
        ? t('admin.workouts.view.ownShoes')
        : SHOE_SIZE_LABELS[Number(p.ShoeSize)] || '—';
      return `${idx + 1}. ${p.UserFullName} · ${p.PhoneNumber || '—'} · ${shoeLabel}${p.IsAttended ? ' ✓' : ''}`;
    });

    const text = [header, ...lines].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('admin.workouts.view.copyListSuccess'));
    } catch {
      toast.error(t('admin.workouts.view.copyListError'));
    }
  };

  const handleToggleAttendance = async (participant) => {
    const nextState = !participant.IsAttended;
    setWorkout((prev) => {
      if (!prev) return prev;
      const nextAppointments = (prev.Appointments || []).map((a) =>
        a.Id === participant.Id ? { ...a, IsAttended: nextState } : a
      );
      return {
        ...prev,
        AttendedCount: nextAppointments.filter((a) => a.IsAttended).length,
        Appointments: nextAppointments,
      };
    });

    try {
      await WorkoutService.setParticipantAttendance(participant.Id, nextState);
    } catch {
      toast.error(t('admin.workouts.view.attendanceUpdateError'));
      fetchWorkout();
    }
  };

  const handleModalConfirm = async (payload) => {
    if (modalState.mode === 'edit' && modalState.participant) {
      const updated = await WorkoutService.updateParticipant(modalState.participant.Id, payload);
      setWorkout(updated);
      toast.success(t('admin.workouts.view.updateParticipantSuccess'));
    } else {
      const updated = await WorkoutService.addParticipantToWorkout(id, payload);
      setWorkout(updated);
      toast.success(t('admin.workouts.view.addSuccess'));
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await WorkoutService.removeParticipantFromWorkout(removeTarget.Id);
      const refreshed = await WorkoutService.getWorkoutById(id);
      setWorkout(refreshed);
      toast.success(t('admin.workouts.removeParticipantSuccess'));
      setRemoveTarget(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message;
      toast.error(msg || t('admin.workouts.removeParticipantError'));
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return <div className="adm-loading" role="status">{t('admin.workouts.view.loading')}</div>;
  }

  if (error || !workout) {
    return (
      <div className="adm-empty">
        <h3>{error || t('admin.workouts.view.notFound')}</h3>
        <Link to="/admin/workouts" className="adm-btn adm-btn--secondary">
          {t('admin.workouts.view.backToWorkouts')}
        </Link>
      </div>
    );
  }

  const translatedDay = workout.Day
    ? t(`days.${workout.Day.toLowerCase()}`, { defaultValue: workout.Day })
    : '';
  const taken = workout.TakenSpots ?? participants.length;
  const total = workout.TotalSpots ?? (workout.AvailableSpots + taken);
  const attendedCount = workout.AttendedCount ?? participants.filter((p) => p.IsAttended).length;
  const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;

  return (
    <div className="workout-hub-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <Link to="/admin/workouts" className="back-crumb no-print">
            {t('admin.workouts.view.backToWorkouts')}
          </Link>
          <h1>
            {t('admin.workouts.view.heading', {
              day: translatedDay,
              date: formatWorkoutDateBg(workout.Date),
              time: workout.Time,
            })}
          </h1>
        </div>

        <div className="adm-header-actions no-print">
          <div className="quick-status-wrap">
            <label htmlFor="hub-quick-status">{t('admin.workouts.view.quickStatusLabel')}</label>
            <select
              id="hub-quick-status"
              className="adm-select quick-status-select"
              value={workout.Status}
              disabled={updatingStatus}
              onChange={handleStatusChange}
            >
              {['Available', 'Booked', 'Completed', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {t(`admin.workouts.statuses.${s.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={handleDuplicate}
            disabled={duplicating}
          >
            <FaCopy aria-hidden="true" /> {t('admin.workouts.duplicateBtn')}
          </button>

          <Link to={`/admin/workouts/${workout.Id}`} className="adm-btn adm-btn--secondary">
            <FaEdit aria-hidden="true" /> {t('admin.workouts.view.editWorkoutBtn')}
          </Link>

          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={handleCopyList}
          >
            <FaCopy aria-hidden="true" /> {t('admin.workouts.view.copyListBtn')}
          </button>

          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={() => window.print()}
          >
            <FaPrint aria-hidden="true" /> {t('admin.workouts.view.printBtn')}
          </button>
        </div>
      </div>

      {/* Summary + Shoes Row */}
      <div className="hub-summary-grid">
        <section className="adm-card summary-metrics-card">
          <h3>{t('admin.workouts.view.infoTitle')}</h3>
          <div className="metric-stats">
            <div className="metric-box">
              <span>{t('admin.workouts.view.occupancyLabel')}</span>
              <strong className="tabular-nums">
                {taken} / {total}
              </strong>
              <small className="tabular-nums">
                {t('admin.workouts.spotsLeft', { count: workout.AvailableSpots })}
              </small>
            </div>
            <div className="metric-box">
              <span>{t('admin.workouts.view.attendanceLabel')}</span>
              <strong className="tabular-nums">
                {attendedCount} / {taken}
              </strong>
              <small>Check-in</small>
            </div>
          </div>
          <div className="hub-progress-track" aria-hidden="true">
            <div className="hub-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className="adm-card summary-shoes-card">
          <div className="shoes-header">
            <h3>
              <FaShoePrints aria-hidden="true" /> {t('admin.workouts.view.shoesAvailable')}
            </h3>
            <span className="own-shoes-pill tabular-nums">
              {t('admin.workouts.view.ownShoesBadge', { count: shoeSummary.ownCount })}
            </span>
          </div>
          <div className="shoes-size-cards">
            {shoeSummary.sizes.map((s) => (
              <div key={s.size} className={`shoe-stat-card${s.free === 0 && s.total > 0 ? ' full' : ''}`}>
                <div className="shoe-stat-top">
                  <span className="shoe-size-badge">{s.label}</span>
                  <strong className="tabular-nums">
                    {t('admin.workouts.view.freeShort', { count: s.free })}
                  </strong>
                </div>
                <span className="shoe-stat-sub tabular-nums">
                  {t('admin.workouts.view.bookedShort', { booked: s.taken, total: s.total })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Participants Hub */}
      <section className="adm-card participants-hub-card">
        <div className="participants-header">
          <div className="participants-title-wrap">
            <h2>{t('admin.workouts.view.registeredClients', { count: participants.length })}</h2>
          </div>

          <div className="participants-actions no-print">
            <div className="adm-search-field">
              <FaSearch className="adm-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="adm-input"
                placeholder={t('admin.workouts.view.participantSearchPlaceholder')}
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
              />
            </div>

            <div className="attendance-tabs" role="tablist">
              {[
                { id: 'all', label: t('admin.workouts.view.filterAll') },
                { id: 'attended', label: t('admin.workouts.view.filterAttended') },
                { id: 'pending', label: t('admin.workouts.view.filterPending') },
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  type="button"
                  role="tab"
                  aria-selected={attendanceFilter === tabItem.id}
                  className={`att-tab${attendanceFilter === tabItem.id ? ' active' : ''}`}
                  onClick={() => setAttendanceFilter(tabItem.id)}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="adm-btn adm-btn--primary"
              onClick={() => setModalState({ open: true, mode: 'add', participant: null })}
            >
              <FaPlus aria-hidden="true" /> {t('admin.workouts.addParticipant').replace(/^\+\s*/, '')}
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="participants-empty">
            <p>{t('admin.workouts.view.noClients')}</p>
            <button
              type="button"
              className="adm-btn adm-btn--primary no-print"
              onClick={() => setModalState({ open: true, mode: 'add', participant: null })}
            >
              <FaPlus aria-hidden="true" /> {t('admin.workouts.addParticipant').replace(/^\+\s*/, '')}
            </button>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="participants-empty">
            <p>{t('admin.workouts.view.noFilteredClients')}</p>
          </div>
        ) : (
          <div className="participants-list">
            {filteredParticipants.map((p, index) => (
              <div
                key={p.Id}
                className={`participant-row${p.IsAttended ? ' attended' : ''}`}
              >
                <div className="participant-left">
                  <button
                    type="button"
                    className={`checkin-btn no-print${p.IsAttended ? ' checked' : ''}`}
                    onClick={() => handleToggleAttendance(p)}
                    aria-pressed={p.IsAttended}
                  >
                    <FaCheck aria-hidden="true" />
                    <span>
                      {p.IsAttended
                        ? t('admin.workouts.view.checkedInBtn')
                        : t('admin.workouts.view.checkInBtn')}
                    </span>
                  </button>

                  <div className="participant-info">
                    <div className="participant-name-line">
                      <span className="row-index tabular-nums">{index + 1}.</span>
                      <strong>{p.UserFullName}</strong>
                      <span className={`shoe-pill${p.UsesOwnShoes ? ' own' : ''}`}>
                        {p.UsesOwnShoes
                          ? t('admin.workouts.view.ownShoes')
                          : `${t('admin.workouts.view.shoe')} ${SHOE_SIZE_LABELS[Number(p.ShoeSize)] || t('admin.workouts.view.notAssigned')}`}
                      </span>
                    </div>

                    <div className="participant-contacts">
                      {p.PhoneNumber && (
                        <a
                          href={`tel:${p.PhoneNumber.replace(/\s+/g, '')}`}
                          className="contact-link tabular-nums"
                        >
                          <FaPhone aria-hidden="true" /> {p.PhoneNumber}
                        </a>
                      )}
                      {p.UserEmail ? (
                        <a href={`mailto:${p.UserEmail}`} className="contact-link">
                          <FaEnvelope aria-hidden="true" /> {p.UserEmail}
                        </a>
                      ) : (
                        <span className="no-email-tag">{t('admin.workouts.view.noEmailBadge')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="participant-actions no-print">
                  <button
                    type="button"
                    className="adm-btn adm-btn--secondary adm-btn--sm"
                    onClick={() => setModalState({ open: true, mode: 'edit', participant: p })}
                  >
                    <FaEdit aria-hidden="true" /> {t('admin.workouts.view.editParticipantBtn')}
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn--danger-soft adm-btn--sm"
                    onClick={() => setRemoveTarget(p)}
                    aria-label={t('admin.workouts.removeParticipantAria')}
                  >
                    <FaTrashAlt aria-hidden="true" /> {t('admin.workouts.view.removeParticipantBtn')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ParticipantFormModal
        visible={modalState.open}
        mode={modalState.mode}
        initialParticipant={modalState.participant}
        workout={workout}
        onClose={() => setModalState({ open: false, mode: 'add', participant: null })}
        onConfirm={handleModalConfirm}
      />

      <AdminConfirmModal
        isOpen={Boolean(removeTarget)}
        title={t('admin.workouts.view.removeParticipantModal.title')}
        message={
          removeTarget
            ? t('admin.workouts.view.removeParticipantModal.prompt', {
                name: removeTarget.UserFullName,
              })
            : ''
        }
        warning={t('admin.workouts.view.removeParticipantModal.warning')}
        confirmLabel={t('admin.workouts.view.removeParticipantModal.confirm')}
        isSubmitting={isRemoving}
        onConfirm={handleConfirmRemove}
        onCancel={() => !isRemoving && setRemoveTarget(null)}
      />
    </div>
  );
};

export default WorkoutView;
