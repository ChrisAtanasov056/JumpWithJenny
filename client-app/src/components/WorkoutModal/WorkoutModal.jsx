import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaInfoCircle, FaCalendarAlt, FaShoePrints, FaUser } from 'react-icons/fa';
import axios from '../../api/axius';
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

const SHOE_SIZE_LABELS = {
  1: 'S (36-38)',
  2: 'M (39-41)',
  3: 'L (42-44)',
  4: 'XL (44-46)',
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
  'INVALID_FULL_NAME',
  'INVALID_EMAIL',
  'INVALID_PHONE_NUMBER',
  'BOOKING_NOT_FOUND',
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

const isValidPhone = (phone) => {
  const trimmed = phone.trim();
  if (trimmed.length < 7 || trimmed.length > 30 || !/^\+?[0-9\s\-()]{7,30}$/.test(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const WorkoutModal = ({
  isOpen,
  onClose,
  selectedWorkout,
  onRegister,
  savedCancellationToken,
  onClearStaleToken,
  onBookingCancelled,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const justRegisteredRef = useRef(false);

  useOutsideClick(modalRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [existingBooking, setExistingBooking] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
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
    if (!isOpen) {
      justRegisteredRef.current = false;
      setError('');
      setIsCheckingRegistration(false);
      setExistingBooking(null);
      setCancelSuccess(false);
      setIsRegistrationSuccess(false);
      setSubmittedEmail('');
      setIsSubmitting(false);
      return;
    }

    if (!selectedWorkoutId) {
      return;
    }

    // Keep showing the newly completed registration confirmation without re-fetching.
    if (justRegisteredRef.current) {
      return;
    }

    const prefs = loadBookingPreferences();
    const counts = computeShoeAvailability(selectedWorkout);
    setFullName(prefs.fullName);
    setEmail(prefs.email);
    setPhoneNumber(prefs.phoneNumber);
    setUsesOwnShoes(prefs.usesOwnShoes);
    setSelectedSize(
      !prefs.usesOwnShoes && prefs.shoeSize && counts[prefs.shoeSize] > 0
        ? prefs.shoeSize
        : ''
    );
    setError('');
    setCancelSuccess(false);
    setIsRegistrationSuccess(false);
    setSubmittedEmail('');
    setExistingBooking(null);

    if (!savedCancellationToken) {
      setIsCheckingRegistration(false);
      return;
    }

    let isCancelled = false;
    setIsCheckingRegistration(true);

    axios
      .get(`/api/Schedule/cancel/${encodeURIComponent(savedCancellationToken)}`)
      .then((response) => {
        if (!isCancelled) {
          setExistingBooking(response.data);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        if (err?.response?.status === 404) {
          onClearStaleToken?.(selectedWorkoutId);
          setExistingBooking(null);
        } else {
          setError(getLocalizedBookingError(err, 'errorCheckingRegistration'));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCheckingRegistration(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedWorkoutId, selectedWorkout, savedCancellationToken, onClearStaleToken, getLocalizedBookingError]);

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

  const handleCancelExistingBooking = async () => {
    if (!savedCancellationToken || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`/api/Schedule/cancel/${encodeURIComponent(savedCancellationToken)}`);
      setExistingBooking(null);
      setCancelSuccess(true);
      await onBookingCancelled?.(selectedWorkoutId);
    } catch (err) {
      if (err?.response?.status === 404) {
        onClearStaleToken?.(selectedWorkoutId);
        setExistingBooking(null);
      } else {
        setError(getLocalizedBookingError(err, 'errorCancelRegistration'));
      }
    } finally {
      setIsSubmitting(false);
    }
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

    const trimmedPhone = phoneNumber.trim();
    if (!isValidPhone(trimmedPhone)) {
      setError(t('bookingForm.errorPhone'));
      return;
    }

    const parsedShoeSize = usesOwnShoes ? null : SHOE_SIZE_MAP[selectedSize] ?? null;
    if (!usesOwnShoes && !parsedShoeSize) {
      setError(t('errorSelectShoes'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      justRegisteredRef.current = true;
      await onRegister(selectedWorkout, {
        fullName: trimmedName,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        shoeSize: parsedShoeSize,
        usesOwnShoes,
      });

      saveBookingPreferences({
        fullName: trimmedName,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        shoeSize: usesOwnShoes ? undefined : selectedSize,
        usesOwnShoes,
      });

      setSubmittedEmail(trimmedEmail);
      setIsRegistrationSuccess(true);
    } catch (err) {
      justRegisteredRef.current = false;
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
              {isCheckingRegistration ? (
                <div className="status-message loading" role="status">
                  <FaInfoCircle className="status-icon" aria-hidden="true" />
                  <p>{t('checkingRegistration')}</p>
                </div>
              ) : cancelSuccess ? (
                <div className="status-message success" role="status">
                  <FaCheck className="status-icon" aria-hidden="true" />
                  <p>{t('registrationCancelled')}</p>
                  <button type="button" onClick={onClose} className="btn-close-prompt">
                    {t('close')}
                  </button>
                </div>
              ) : existingBooking ? (
                <div className="status-message info existing-booking-panel">
                  <FaInfoCircle className="status-icon" aria-hidden="true" />
                  <p>{t('alreadyRegistered')}</p>
                  <div className="existing-booking-summary">
                    <div><strong>{t('bookingForm.fullNameLabel')}:</strong> {existingBooking.FullName}</div>
                    {existingBooking.PhoneNumber && (
                      <div><strong>{t('bookingForm.phoneLabel')}:</strong> {existingBooking.PhoneNumber}</div>
                    )}
                    <div>
                      <strong>{t('cancelBooking.shoesLabel')}</strong>{' '}
                      {existingBooking.UsesOwnShoes
                        ? t('admin.workouts.view.ownShoes')
                        : SHOE_SIZE_LABELS[Number(existingBooking.ShoeSize)] || t('admin.common.notAvailable')}
                    </div>
                  </div>
                  {error && <div className="error-message" role="alert">{error}</div>}
                  {existingBooking.CanCancel ? (
                    <button
                      type="button"
                      onClick={handleCancelExistingBooking}
                      disabled={isSubmitting}
                      className="btn-cancel"
                    >
                      {isSubmitting ? t('cancelBooking.cancelling') : t('cancelRegistration')}
                    </button>
                  ) : (
                    <p className="status-subtext">{t('cancelBooking.pastWorkoutNotice')}</p>
                  )}
                </div>
              ) : isRegistrationSuccess ? (
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
                          <div className="input-group-field">
                            <label htmlFor="booking-phone">{t('bookingForm.phoneLabel')}</label>
                            <input
                              id="booking-phone"
                              name="tel"
                              type="tel"
                              autoComplete="tel"
                              placeholder={t('bookingForm.phonePlaceholder')}
                              value={phoneNumber}
                              onChange={(e) => {
                                setPhoneNumber(e.target.value);
                                setError('');
                              }}
                              maxLength={30}
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
