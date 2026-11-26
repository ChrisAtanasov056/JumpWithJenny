import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCalendarTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import axios from '../../api/axius';
import { formatWorkoutDateBg } from '../../utils/workoutDate';
import { removeMyBookingByToken } from '../../utils/bookingStorage';
import './CancelBookingPage.scss';

const SHOE_SIZE_LABELS = {
  1: 'S (36-38)',
  2: 'M (39-41)',
  3: 'L (42-44)',
  4: 'XL (44-46)',
};

const CancelBookingPage = () => {
  const { token } = useParams();
  const { t } = useTranslation();

  const [status, setStatus] = useState('loading');
  const [details, setDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBookingDetails = useCallback(async () => {
    if (!token) {
      setStatus('notFound');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await axios.get(`/api/Schedule/cancel/${encodeURIComponent(token)}`);
      setDetails(response.data);
      setStatus('details');
    } catch (err) {
      if (err?.response?.status === 404) {
        removeMyBookingByToken(token);
        setStatus('notFound');
      } else if (err?.response?.status === 429) {
        setErrorMessage(t('bookingErrors.RATE_LIMITED'));
        setStatus('error');
      } else {
        setErrorMessage(t('cancelBooking.loadError'));
        setStatus('error');
      }
    }
  }, [token, t]);

  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  const handleConfirmCancel = async () => {
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await axios.post(`/api/Schedule/cancel/${encodeURIComponent(token)}`);
      removeMyBookingByToken(token);
      setStatus('cancelled');
    } catch (err) {
      const code = err?.response?.data?.code;
      if (err?.response?.status === 404 || code === 'BOOKING_NOT_FOUND') {
        removeMyBookingByToken(token);
        setStatus('notFound');
      } else if (code === 'WORKOUT_PAST') {
        setErrorMessage(t('bookingErrors.WORKOUT_PAST'));
      } else if (err?.response?.status === 429) {
        setErrorMessage(t('bookingErrors.RATE_LIMITED'));
      } else {
        setErrorMessage(t('cancelBooking.cancelError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const translatedDay = details?.WorkoutDay
    ? t(`days.${details.WorkoutDay.toLowerCase()}`, { defaultValue: details.WorkoutDay })
    : '';

  const shoeDisplay = details?.UsesOwnShoes
    ? t('admin.workouts.view.ownShoes')
    : SHOE_SIZE_LABELS[Number(details?.ShoeSize)] || t('admin.common.notAvailable');

  return (
    <section className="cancel-booking-page">
      <div className="cancel-booking-card">
        {status === 'loading' && (
          <div className="cancel-state" role="status">
            <FaSpinner className="state-icon spin" aria-hidden="true" />
            <p>{t('cancelBooking.loading')}</p>
          </div>
        )}

        {status === 'notFound' && (
          <div className="cancel-state">
            <FaExclamationTriangle className="state-icon warning" aria-hidden="true" />
            <h1>{t('cancelBooking.notFoundTitle')}</h1>
            <p>{t('cancelBooking.notFoundMessage')}</p>
            <Link to="/#schedule" className="btn-primary-link">
              {t('cancelBooking.backToSchedule')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="cancel-state" role="alert">
            <FaExclamationTriangle className="state-icon warning" aria-hidden="true" />
            <h1>{t('cancelBooking.errorTitle')}</h1>
            <p>{errorMessage}</p>
            <Link to="/" className="btn-primary-link">
              {t('notFound.backHome')}
            </Link>
          </div>
        )}

        {status === 'cancelled' && (
          <div className="cancel-state" role="status">
            <FaCheckCircle className="state-icon success" aria-hidden="true" />
            <h1>{t('cancelBooking.successTitle')}</h1>
            <p>{t('cancelBooking.successMessage')}</p>
            <Link to="/#schedule" className="btn-primary-link">
              {t('cancelBooking.backToSchedule')}
            </Link>
          </div>
        )}

        {status === 'details' && details && (
          <div className="cancel-details">
            <div className="cancel-header">
              <FaCalendarTimes className="header-icon" aria-hidden="true" />
              <h1>{t('cancelBooking.title')}</h1>
              <p>{t('cancelBooking.subtitle')}</p>
            </div>

            {details.TrainerNote && (
              <div className="cancel-trainer-note" role="note">
                <span aria-hidden="true">💬</span>
                <div>
                  <strong>{t('cancelBooking.trainerNoteLabel')}</strong>
                  <p>{details.TrainerNote}</p>
                </div>
              </div>
            )}

            <div className="booking-summary">
              <div className="summary-row">
                <span className="summary-label">{t('cancelBooking.participantLabel')}</span>
                <span className="summary-value">{details.FullName}</span>
              </div>
              {details.PhoneNumber && (
                <div className="summary-row">
                  <span className="summary-label">{t('cancelBooking.phoneLabel')}</span>
                  <span className="summary-value">{details.PhoneNumber}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">{t('cancelBooking.dayLabel')}</span>
                <span className="summary-value">{translatedDay}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">{t('cancelBooking.dateLabel')}</span>
                <span className="summary-value">{formatWorkoutDateBg(details.WorkoutDate)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">{t('cancelBooking.timeLabel')}</span>
                <span className="summary-value">{details.WorkoutTime}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">{t('cancelBooking.shoesLabel')}</span>
                <span className="summary-value">{shoeDisplay}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="cancel-error-alert" role="alert">
                {errorMessage}
              </div>
            )}

            {details.CanCancel ? (
              <div className="cancel-actions">
                <button
                  type="button"
                  className="btn-confirm-cancel"
                  onClick={handleConfirmCancel}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('cancelBooking.cancelling') : t('cancelBooking.confirmButton')}
                </button>
                <Link to="/#schedule" className="btn-secondary-link">
                  {t('cancelBooking.keepBooking')}
                </Link>
              </div>
            ) : (
              <div className="cancel-past-notice">
                <p>{t('cancelBooking.pastWorkoutNotice')}</p>
                <Link to="/#schedule" className="btn-primary-link">
                  {t('cancelBooking.backToSchedule')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CancelBookingPage;
