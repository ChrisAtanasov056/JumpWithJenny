import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaInfoCircle, FaCalendarAlt, FaShoePrints, FaCreditCard, FaUser } from 'react-icons/fa';
import './WorkoutModal.scss';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';
import { formatWorkoutDateBg } from '../../utils/workoutDate';
import { loadBookingPreferences, saveBookingPreferences } from '../../utils/bookingStorage';

const SHOE_SIZE_MAP = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
};

const SHOE_SIZE_RANGES = {
  S: '(36-38)',
  M: '(39-41)',
  L: '(42-44)',
  XL: '(44-46)',
};

const ALL_SHOE_SIZES = ['S', 'M', 'L', 'XL'];

const BOOKING_ERROR_CODES = new Set([
  'WORKOUT_NOT_FOUND',
  'WORKOUT_PAST',
  'WORKOUT_NOT_AVAILABLE',
  'ALREADY_REGISTERED',
  'MAX_ACTIVE_BOOKINGS',
  'NO_AVAILABLE_SPOTS',
  'NO_AVAILABLE_SHOES',
  'INVALID_SHOE_SIZE',
  'INVALID_CARD_TYPE',
  'INVALID_FULL_NAME',
  'INVALID_EMAIL',
  'CONCURRENCY_CONFLICT',
]);

const computeShoeAvailability = (workout) => {
  const counts = { S: 0, M: 0, L: 0, XL: 0 };
  if (!workout?.WorkoutShoes) {
    return counts;
  }

  workout.WorkoutShoes.forEach((ws) => {
    if (!ws.IsTaken && ws.Shoe) {
      switch (ws.Shoe.Size) {
        case 1: counts.S += 1; break;
        case 2: counts.M += 1; break;
        case 3: counts.L += 1; break;
        case 4: counts.XL += 1; break;
        default: break;
      }
    }
  });
  return counts;
};

const WorkoutModal = ({
  isOpen,
  onClose,
  selectedWorkout,
  onRegister,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  useOutsideClick(modalRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCard, setSelectedCard] = useState('3');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkoutId = selectedWorkout?.Id;

  const shoeAvailability = useMemo(
    () => computeShoeAvailability(selectedWorkout),
    [selectedWorkout]
  );

  const availableSizes = useMemo(
    () => ALL_SHOE_SIZES.filter((size) => (shoeAvailability[size] ?? 0) > 0),
    [shoeAvailability]
  );

  const getLocalizedBookingError = useCallback(
    (err, fallbackKey) => {
      if (err?.response?.status === 429) {
        return t('bookingErrors.RATE_LIMITED');
      }
      const code = err?.response?.data?.code;
      if (code && BOOKING_ERROR_CODES.has(code)) {
        return t(`bookingErrors.${code}`);
      }
      return t(fallbackKey);
    },
    [t]
  );

  useEffect(() => {
    if (isOpen && selectedWorkoutId) {
      const prefs = loadBookingPreferences();
      const counts = computeShoeAvailability(selectedWorkout);
      setFullName(prefs.fullName);
      setEmail(prefs.email);
      setUsesOwnShoes(prefs.usesOwnShoes);
      setSelectedCard(prefs.cardType || '3');
      setSelectedSize(
        !prefs.usesOwnShoes && prefs.shoeSize && counts[prefs.shoeSize] > 0
          ? prefs.shoeSize
          : ''
      );
      setError('');
      setIsRegistrationSuccess(false);
      setSubmittedEmail('');
    } else if (!isOpen) {
      setError('');
      setIsRegistrationSuccess(false);
      setSubmittedEmail('');
      setIsSubmitting(false);
    }
  }, [isOpen, selectedWorkoutId, selectedWorkout]);

  const handleSizeClick = (size) => {
    setSelectedSize(size);
    setError('');
  };

  const handleOwnShoesChange = (e) => {
    const checked = e.target.checked;
    setUsesOwnShoes(checked);
    if (checked) {
      setSelectedSize('');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setError(t('bookingForm.errorFullName'));
      return;
    }

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t('bookingForm.errorEmail'));
      return;
    }

    const parsedShoeSize = usesOwnShoes ? null : SHOE_SIZE_MAP[selectedSize] ?? null;
    if (!usesOwnShoes && !parsedShoeSize) {
      setError(t('errorSelectShoes'));
      return;
    }

    const parsedCardType = Number(selectedCard) || 3;

    setIsSubmitting(true);
    setError('');

    try {
      await onRegister(selectedWorkout, {
        fullName: trimmedName,
        email: trimmedEmail,
        shoeSize: parsedShoeSize,
        usesOwnShoes,
        cardType: parsedCardType,
      });

      saveBookingPreferences({
        fullName: trimmedName,
        email: trimmedEmail,
        shoeSize: usesOwnShoes ? undefined : selectedSize,
        usesOwnShoes,
        cardType: String(parsedCardType),
      });

      setSubmittedEmail(trimmedEmail);
      setIsRegistrationSuccess(true);
    } catch (err) {
      console.error('Registration failed:', err);
      setIsRegistrationSuccess(false);
      setError(getLocalizedBookingError(err, 'registrationError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSpots = selectedWorkout?.AvailableSpots ?? 0;
  const takenSpots = selectedWorkout?.TakenSpots ?? 0;
  const maxSpots = selectedWorkout?.TotalSpots || (availableSpots + takenSpots) || availableSpots;
  const isFull = availableSpots <= 0 || selectedWorkout?.Status?.toLowerCase() === 'booked';
  const progressPercent = maxSpots > 0 ? Math.min(100, (takenSpots / maxSpots) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label={t('close')}
            >
              <FaTimes aria-hidden="true" />
            </button>

            <div className="modal-header">
              <FaCalendarAlt className="header-icon" aria-hidden="true" />
              <h3>{t('registerFor')}</h3>
              <h2 id="workout-modal-title">
                {selectedWorkout?.Day ? t(`days.${selectedWorkout.Day.toLowerCase()}`) : ''} {t('at')} {selectedWorkout?.Time}
              </h2>
              {selectedWorkout?.Date && (
                <p className="workout-date-subtitle">{formatWorkoutDateBg(selectedWorkout.Date)}</p>
              )}
            </div>

            <div className="modal-body">
              {isRegistrationSuccess ? (
                <div className="status-message success" role="status">
                  <FaCheck className="status-icon" aria-hidden="true" />
                  <p>{t('registrationSuccess')}</p>
                  <span className="status-subtext">
                    {t('bookingForm.confirmationEmailNotice', { email: submittedEmail })}
                  </span>
                  <button type="button" onClick={onClose} className="btn-close-prompt">
                    {t('close')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {!isFull ? (
                    <>
                      <div className="spot-progress">
                        <span className="spots-text">
                          {t('spotsTaken', { taken: takenSpots, max: maxSpots })}
                        </span>
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4 className="section-title">
                          <FaUser aria-hidden="true" /> {t('bookingForm.contactDetailsTitle')}
                        </h4>
                        <div className="guest-fields">
                          <div className="input-group-field">
                            <label htmlFor="booking-full-name">{t('bookingForm.fullNameLabel')}</label>
                            <input
                              id="booking-full-name"
                              name="name"
                              type="text"
                              autoComplete="name"
                              placeholder={t('bookingForm.fullNamePlaceholder')}
                              value={fullName}
                              onChange={(e) => {
                                setFullName(e.target.value);
                                setError('');
                              }}
                              maxLength={120}
                              required
                            />
                          </div>
                          <div className="input-group-field">
                            <label htmlFor="booking-email">{t('bookingForm.emailLabel')}</label>
                            <input
                              id="booking-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              placeholder={t('bookingForm.emailPlaceholder')}
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                              }}
                              maxLength={254}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h4 className="section-title">
                          <FaShoePrints aria-hidden="true" /> {t('shoesTitle')}
                        </h4>
                        <div className="option-group">
                          <label className="checkbox-container" htmlFor="workout-own-shoes">
                            <input
                              id="workout-own-shoes"
                              type="checkbox"
                              checked={usesOwnShoes}
                              onChange={handleOwnShoesChange}
                            />
                            <span className="checkmark" aria-hidden="true"></span>
                            {t('useOwnShoes')}
                          </label>
                        </div>

                        {!usesOwnShoes && (
                          availableSizes.length > 0 ? (
                            <div className="size-selection-grid">
                              {availableSizes.map((size) => {
                                const available = shoeAvailability[size];

                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    aria-pressed={selectedSize === size}
                                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => handleSizeClick(size)}
                                  >
                                    {size}
                                    <br />
                                    <small>{SHOE_SIZE_RANGES[size]}</small>
                                    <br />
                                    <span className="availability">
                                      {`${available} ${available === 1 ? t('availableSingular') : t('available')}`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="no-shoes-notice" role="status">
                              {t('bookingForm.onlyOwnShoesLeft')}
                            </div>
                          )
                        )}
                      </div>

                      <div className="form-section">
                        <h4 className="section-title">
                          <FaCreditCard aria-hidden="true" /> {t('selectCardTitle')}
                        </h4>
                        <div className="card-select-wrapper">
                          <label htmlFor="workout-card-select" className="visually-hidden">
                            {t('selectCardTitle')}
                          </label>
                          <select
                            id="workout-card-select"
                            className="styled-select"
                            value={selectedCard}
                            onChange={(e) => {
                              setSelectedCard(e.target.value);
                              setError('');
                            }}
                          >
                            <option value="3">{t('individualWorkout')}</option>
                            <option value="1">{t('coolfitCard')}</option>
                            <option value="2">{t('pulseCard')}</option>
                          </select>
                        </div>
                      </div>

                      {error && <div className="error-message" role="alert">{error}</div>}

                      <button
                        type="submit"
                        className="btn-submit"
                        disabled={isSubmitting || (!usesOwnShoes && !selectedSize)}
                      >
                        {isSubmitting ? t('schedule.registering') : t('submit')}
                      </button>
                    </>
                  ) : (
                    <div className="status-message full">
                      <FaInfoCircle className="status-icon" aria-hidden="true" />
                      <p>{t('fullNotice')}</p>
                      <button type="button" onClick={onClose} className="btn-close-full">
                        {t('close')}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutModal;
