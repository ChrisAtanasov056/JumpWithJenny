import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../services/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from '../../api/axius';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaInfoCircle, FaCalendarAlt, FaShoePrints, FaCreditCard } from 'react-icons/fa';
import './WorkoutModal.scss';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';

const SHOE_SIZE_MAP = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
};

const BOOKING_ERROR_CODES = new Set([
  'WORKOUT_NOT_FOUND',
  'USER_NOT_FOUND',
  'EMAIL_NOT_CONFIRMED',
  'WORKOUT_PAST',
  'WORKOUT_NOT_AVAILABLE',
  'ALREADY_REGISTERED',
  'NO_AVAILABLE_SPOTS',
  'NO_AVAILABLE_SHOES',
  'INVALID_SHOE_SIZE',
  'INVALID_CARD_TYPE',
  'CONCURRENCY_CONFLICT',
]);

const WorkoutModal = ({
  isOpen,
  onClose,
  selectedWorkout,
  onRegister,
  onRegistrationCancelled,
  isLoggedIn,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const modalRef = useRef(null);
  const timeoutRef = useRef(null);

  useOutsideClick(modalRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef });

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shoeAvailability, setShoeAvailability] = useState({});

  const selectedWorkoutId = selectedWorkout?.Id;

  const getLocalizedBookingError = useCallback(
    (err, fallbackKey) => {
      const code = err?.response?.data?.code;
      if (code && BOOKING_ERROR_CODES.has(code)) {
        return t(`bookingErrors.${code}`);
      }
      return t(fallbackKey);
    },
    [t]
  );

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPendingTimeout();
  }, []);

  const resetFormStates = useCallback(() => {
    clearPendingTimeout();
    setSelectedSize('');
    setSelectedCard('');
    setUsesOwnShoes(false);
    setError('');
    setIsAlreadyRegistered(false);
    setCancelSuccess(false);
    setIsRegistrationSuccess(false);
  }, []);

  const checkUserRegistration = useCallback(async () => {
    setIsCheckingRegistration(true);
    try {
      if (selectedWorkoutId && user?.id) {
        const response = await axios.get(`/api/Schedule/is-registered/${selectedWorkoutId}`);
        setIsAlreadyRegistered(Boolean(response.data));
      }
    } catch (err) {
      console.error('Error checking registration:', err);
      if (err.response && err.response.status === 401) {
        setIsAlreadyRegistered(false);
      } else {
        setError(t('errorCheckingRegistration'));
        setIsAlreadyRegistered(false);
      }
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [selectedWorkoutId, user?.id, t]);

  useEffect(() => {
    if (isOpen && selectedWorkout?.WorkoutShoes) {
      const counts = { S: 0, M: 0, L: 0, XL: 0 };
      selectedWorkout.WorkoutShoes.forEach((ws) => {
        if (!ws.IsTaken && ws.Shoe) {
          switch (ws.Shoe.Size) {
            case 1: counts.S++; break;
            case 2: counts.M++; break;
            case 3: counts.L++; break;
            case 4: counts.XL++; break;
            default: break;
          }
        }
      });
      setShoeAvailability(counts);
    }
  }, [isOpen, selectedWorkout]);

  useEffect(() => {
    if (isOpen && isLoggedIn && selectedWorkoutId) {
      resetFormStates();
      checkUserRegistration();
    } else if (!isOpen) {
      resetFormStates();
    }
  }, [isOpen, selectedWorkoutId, isLoggedIn, checkUserRegistration, resetFormStates]);

  const handleCancelRegistration = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await axios.delete(`/api/Schedule/cancel-registration/${selectedWorkoutId}`);
      setCancelSuccess(true);
      if (onRegistrationCancelled) {
        await onRegistrationCancelled();
      }
      timeoutRef.current = setTimeout(() => {
        setIsAlreadyRegistered(false);
        setCancelSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error canceling registration:', err);
      setError(getLocalizedBookingError(err, 'errorCancelRegistration'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
    setError('');
  };

  const handleCardChange = (e) => {
    setSelectedCard(e.target.value);
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
    if (!user?.emailConfirmed) {
      setError(t('errorAccountNotConfirmed'));
      return;
    }

    const parsedShoeSize = usesOwnShoes ? null : SHOE_SIZE_MAP[selectedSize] ?? null;
    if (!usesOwnShoes && !parsedShoeSize) {
      setError(t('errorSelectShoes'));
      return;
    }

    const parsedCardType = Number(selectedCard);
    if (!parsedCardType) {
      setError(t('errorSelectCard'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onRegister(
        selectedWorkout,
        parsedShoeSize,
        parsedCardType,
        usesOwnShoes
      );

      setIsRegistrationSuccess(true);
      timeoutRef.current = setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      const code = err?.response?.data?.code;
      if (code === 'ALREADY_REGISTERED') {
        setIsAlreadyRegistered(true);
      }
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
            aria-labelledby={isLoggedIn && user?.emailConfirmed ? 'workout-modal-title' : undefined}
            aria-label={isLoggedIn && user?.emailConfirmed ? undefined : t('registerFor')}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label={t('close')}
            >
              <FaTimes aria-hidden="true" />
            </button>

            {isLoggedIn ? (
              !user?.emailConfirmed ? (
                <div className="status-message info">
                  <FaInfoCircle className="status-icon" aria-hidden="true" />
                  <p>{t('errorAccountNotConfirmed')}</p>
                  <button type="button" onClick={onClose} className="btn-close-prompt">
                    {t('close')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="modal-header">
                    <FaCalendarAlt className="header-icon" aria-hidden="true" />
                    <h3>{t('registerFor')}</h3>
                    <h2 id="workout-modal-title">
                      {selectedWorkout?.Day ? t(`days.${selectedWorkout.Day.toLowerCase()}`) : ''} {t('at')} {selectedWorkout?.Time}
                    </h2>
                  </div>

                  <div className="modal-body">
                    {isCheckingRegistration || isSubmitting ? (
                      <div className="status-message loading" role="status">
                        <FaInfoCircle className="status-icon" aria-hidden="true" />
                        <p>{t('checkingRegistration')}</p>
                      </div>
                    ) : cancelSuccess ? (
                      <div className="status-message success" role="status">
                        <FaCheck className="status-icon" aria-hidden="true" />
                        <p>{t('registrationCancelled')}</p>
                      </div>
                    ) : isAlreadyRegistered ? (
                      <div className="status-message info">
                        <FaInfoCircle className="status-icon" aria-hidden="true" />
                        <p>{t('alreadyRegistered')}</p>
                        {error && <div className="error-message" role="alert">{error}</div>}
                        <button type="button" onClick={handleCancelRegistration} className="btn-cancel">
                          {t('cancelRegistration')}
                        </button>
                      </div>
                    ) : isRegistrationSuccess ? (
                      <div className="status-message success" role="status">
                        <FaCheck className="status-icon" aria-hidden="true" />
                        <p>{t('registrationSuccess')}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
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
                                <div className="size-selection-grid">
                                  {['S', 'M', 'L', 'XL'].map((size) => {
                                    const available = shoeAvailability[size] ?? 0;
                                    const isDisabled = available <= 0;

                                    return (
                                      <button
                                        key={size}
                                        type="button"
                                        aria-pressed={selectedSize === size}
                                        className={`size-btn ${selectedSize === size ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => !isDisabled && handleSizeClick(size)}
                                        disabled={isDisabled}
                                      >
                                        {size}
                                        <br />
                                        <small>
                                          {size === 'S' && '(36-38)'}
                                          {size === 'M' && '(39-41)'}
                                          {size === 'L' && '(42-44)'}
                                          {size === 'XL' && '(44-46)'}
                                        </small>
                                        <br />
                                        <span className="availability">
                                          {available > 0
                                            ? `${available} ${available === 1 ? t('availableSingular') : t('available')}`
                                            : t('noShoes')}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
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
                                  onChange={handleCardChange}
                                  required
                                >
                                  <option value="" disabled>{t('selectCardPlaceholder')}</option>
                                  <option value="1">{t('coolfitCard')}</option>
                                  <option value="2">{t('pulseCard')}</option>
                                  <option value="3">{t('individualWorkout')}</option>
                                </select>
                              </div>
                            </div>

                            {error && <div className="error-message" role="alert">{error}</div>}

                            <button
                              type="submit"
                              className="btn-submit"
                              disabled={isSubmitting || !selectedCard || (!usesOwnShoes && !selectedSize)}
                            >
                              {t('submit')}
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
                </>
              )
            ) : (
              <div className="login-prompt-card">
                <FaInfoCircle className="prompt-icon" aria-hidden="true" />
                <h3>{t('loginPromptTitle')}</h3>
                <p>{t('loginPromptText')}</p>
                <button type="button" onClick={onClose} className="btn-close-prompt">
                  {t('close')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutModal;
