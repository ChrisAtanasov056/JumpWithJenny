import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import { addDaysToDatePart, getNextMondayDatePart } from '../../../utils/workoutDate';
import './WeeklyScheduleModal.scss';

const TEMPLATE_STORAGE_KEY = 'jwj_admin_schedule_template_v1';

const DEFAULT_SLOTS = [
  { dayOffset: 0, time: '18:00', spots: 20 },
  { dayOffset: 2, time: '18:00', spots: 20 },
  { dayOffset: 4, time: '18:00', spots: 20 },
  { dayOffset: 5, time: '14:00', spots: 20 },
  { dayOffset: 6, time: '15:00', spots: 20 },
];

const WEEKDAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const loadInitialSlots = () => {
  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SLOTS;
};

const WeeklyScheduleModal = ({ isOpen, onClose, onCreated }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  const [startDate, setStartDate] = useState(getNextMondayDatePart);
  const [slots, setSlots] = useState(loadInitialSlots);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (!startDate) {
        setStartDate(getNextMondayDatePart());
      }
    }
  }, [isOpen, startDate]);

  useOutsideClick(modalRef, onClose, isOpen && !isSubmitting);
  useModalAccessibility({
    isOpen,
    onClose: isSubmitting ? undefined : onClose,
    modalRef,
  });

  if (!isOpen) return null;

  const updateSlot = (index, field, value) => {
    setSlots((prev) =>
      prev.map((slot, idx) => (idx === index ? { ...slot, [field]: value } : slot))
    );
    setError('');
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { dayOffset: 0, time: '18:00', spots: 20 }]);
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || slots.length === 0) {
      setError(t('admin.workouts.weeklyModal.noSlotsError'));
      return;
    }

    const validSlots = slots
      .filter((s) => s.time && Number(s.spots) >= 1)
      .map((s) => {
        const slotDatePart = addDaysToDatePart(startDate, Number(s.dayOffset) || 0);
        return {
          Date: `${slotDatePart}T${s.time}:00`,
          Time: s.time,
          AvailableSpots: Math.min(100, Math.max(1, Number(s.spots) || 20)),
        };
      });

    if (validSlots.length === 0) {
      setError(t('admin.workouts.weeklyModal.noSlotsError'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      try {
        window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(slots));
      } catch {
        // ignore storage errors
      }

      const result = await WorkoutService.createWorkoutsBatch({ Slots: validSlots });
      toast.success(
        t('admin.workouts.weeklyModal.createSuccess', {
          created: result?.CreatedCount ?? validSlots.length,
          skipped: result?.SkippedCount ?? 0,
        })
      );
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      setError(msg || t('admin.workouts.weeklyModal.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="adm-modal-overlay" role="presentation">
      <div
        ref={modalRef}
        className="adm-modal-dialog weekly-schedule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-schedule-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-header">
          <div>
            <h3 id="weekly-schedule-title">{t('admin.workouts.weeklyModal.title')}</h3>
            <p className="modal-subtitle">{t('admin.workouts.weeklyModal.subtitle')}</p>
          </div>
          <button
            type="button"
            className="adm-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t('admin.common.close')}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="weekly-form">
          <div className="form-field">
            <label htmlFor="weekly-start-date">{t('admin.workouts.weeklyModal.startDate')}</label>
            <input
              id="weekly-start-date"
              type="date"
              className="adm-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="slots-header">
            <span>{t('admin.workouts.weeklyModal.slotsTitle')}</span>
            <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" onClick={addSlot}>
              <FaPlus aria-hidden="true" /> {t('admin.workouts.weeklyModal.addSlot').replace(/^\+\s*/, '')}
            </button>
          </div>

          <div className="slots-list">
            {slots.map((slot, index) => (
              <div key={index} className="slot-row">
                <select
                  className="adm-select"
                  value={slot.dayOffset}
                  onChange={(e) => updateSlot(index, 'dayOffset', Number(e.target.value))}
                  aria-label={t('admin.workouts.weeklyModal.dayOffset')}
                >
                  {WEEKDAY_KEYS.map((dayKey, offset) => (
                    <option key={dayKey} value={offset}>
                      {t(`days.${dayKey}`)}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  className="adm-input"
                  value={slot.time}
                  onChange={(e) => updateSlot(index, 'time', e.target.value)}
                  aria-label={t('admin.workouts.weeklyModal.time')}
                  required
                />

                <input
                  type="number"
                  className="adm-input spots-input"
                  min={1}
                  max={100}
                  value={slot.spots}
                  onChange={(e) => updateSlot(index, 'spots', Number(e.target.value))}
                  aria-label={t('admin.workouts.weeklyModal.spots')}
                  required
                />

                <button
                  type="button"
                  className="adm-btn adm-btn--danger-soft adm-btn--sm"
                  onClick={() => removeSlot(index)}
                  aria-label={t('admin.workouts.weeklyModal.removeSlot')}
                >
                  <FaTrashAlt aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {error && <div className="adm-alert adm-alert--error" role="alert">{error}</div>}

          <div className="modal-footer-actions">
            <button
              type="button"
              className="adm-btn adm-btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('admin.common.cancel')}
            </button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>
              {isSubmitting
                ? t('admin.workouts.weeklyModal.creating')
                : t('admin.workouts.weeklyModal.createBtn', { count: slots.length })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeeklyScheduleModal;
