import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from '../../api/axius';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaInfoCircle, FaCalendarAlt, FaShoePrints, FaCreditCard } from 'react-icons/fa';
import './WorkoutModal.scss';

const WorkoutModal = ({ isOpen, onClose, selectedWorkout, onRegister, isLoggedIn }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkUserRegistration = useCallback(async () => {
    setIsCheckingRegistration(true);
    try {
      if (selectedWorkout && user?.id) {
        const response = await axios.get(
          `/api/Schedule/is-registered/${selectedWorkout.Id}`
        );
        setIsAlreadyRegistered(response.data);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      
      if (error.response && error.response.status === 401) {
        setIsAlreadyRegistered(false);
      } else {
        setError(t('errorCheckingRegistration'));
        setIsAlreadyRegistered(false);
      }
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [selectedWorkout, user?.id, t]);

  const resetFormStates = () => {
    setSelectedSize('');
    setSelectedCard('');
    setUsesOwnShoes(false);
    setError('');
    setIsAlreadyRegistered(false);
    setCancelSuccess(false);
    setIsRegistrationSuccess(false);
  };

  useEffect(() => {
    if (isOpen && isLoggedIn && selectedWorkout) {
      resetFormStates();
      checkUserRegistration();
    }
  }, [isOpen, selectedWorkout, isLoggedIn, checkUserRegistration]);

  const handleCancelRegistration = async () => {
    try {
      await axios.delete(`/api/Schedule/cancel-registration/${selectedWorkout.Id}`);
      
      setCancelSuccess(true);
      setTimeout(() => {
        setIsAlreadyRegistered(false);
        setCancelSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error canceling registration:', error);
      setError(t('errorCancelRegistration'));
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
    setUsesOwnShoes(e.target.checked);
    if (e.target.checked) setSelectedSize('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usesOwnShoes && !selectedSize) {
      setError(t('errorSelectShoes'));
      return;
    }
    if (!selectedCard) {
      setError(t('errorSelectCard'));
      return;
    }

    const cardTypeMap = {
      [t('coolfitCard')]: 0,
      [t('pulseCard')]: 1,
      [t('individualWorkout')]: 2
    };

    setIsSubmitting(true);
    setError('');

    try {
      await onRegister(
        selectedWorkout,
        selectedSize || 0,
        cardTypeMap[selectedCard],
        usesOwnShoes
      );

      setIsRegistrationSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Registration failed:', err);
      setIsRegistrationSuccess(false);
      setError(t('registrationError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxSpots = 20;
  const takenSpots = maxSpots - (selectedWorkout?.AvailableSpots ?? 0);
  const isFull = takenSpots >= maxSpots;

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
            initial={{ y: "100vh", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100vh", opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <button className="close-btn" onClick={onClose}><FaTimes /></button>

            {isLoggedIn ? (
              <>
                <div className="modal-header">
                  <FaCalendarAlt className="header-icon" />
                  <h3>{t('registerFor')}</h3>
                  <h2>{t(`days.${selectedWorkout.Day.toLowerCase()}`)} {t('at')} {selectedWorkout.Time}</h2>
                </div>

                <div className="modal-body">
                  {isCheckingRegistration || isSubmitting ? (
                    <div className="status-message loading">
                      <FaInfoCircle className="status-icon" />
                      <p>{t('checkingRegistration')}</p>
                    </div>
                  ) : cancelSuccess ? (
                    <div className="status-message success">
                      <FaCheck className="status-icon" />
                      <p>{t('registrationCancelled')}</p>
                    </div>
                  ) : isAlreadyRegistered ? (
                    <div className="status-message info">
                      <FaInfoCircle className="status-icon" />
                      <p>{t('alreadyRegistered')}</p>
                      <button onClick={handleCancelRegistration} className="btn-cancel">
                        {t('cancelRegistration')}
                      </button>
                    </div>
                  ) : isRegistrationSuccess ? (
                    <div className="status-message success">
                      <FaCheck className="status-icon" />
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
                                style={{ width: `${(takenSpots / maxSpots) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="form-section">
                            <h4 className="section-title"><FaShoePrints /> {t('shoesTitle')}</h4>
                            <div className="option-group">
                              <label className="checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={usesOwnShoes}
                                  onChange={handleOwnShoesChange}
                                />
                                <span className="checkmark"></span>
                                {t('useOwnShoes')}
                              </label>
                            </div>

                            {!usesOwnShoes && (
                              <div className="size-selection-grid">
                                {['S', 'M', 'L', 'XL'].map((size) => (
                                  <button
                                    key={size}
                                    type="button"
                                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                    onClick={() => handleSizeClick(size)}
                                  >
                                    {size}
                                    <br />
                                    <small>
                                      {size === 'S' && '(34-35)'}
                                      {size === 'M' && '(36-38)'}
                                      {size === 'L' && '(39-41)'}
                                      {size === 'XL' && '(42-44)'}
                                    </small>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="form-section">
                            <h4 className="section-title"><FaCreditCard /> {t('selectCardTitle')}</h4>
                            <div className="card-select-wrapper">
                              <select
                                className="styled-select"
                                value={selectedCard}
                                onChange={handleCardChange}
                                required
                              >
                                <option value="" disabled>{t('selectCardPlaceholder')}</option>
                                <option value={t('coolfitCard')}>{t('coolfitCard')}</option>
                                <option value={t('pulseCard')}>{t('pulseCard')}</option>
                                <option value={t('individualWorkout')}>{t('individualWorkout')}</option>
                              </select>
                            </div>
                          </div>
                          
                          {error && <div className="error-message">{error}</div>}

                          <button type="submit" className="btn-submit" disabled={isSubmitting || !selectedCard || (!usesOwnShoes && !selectedSize)}>
                            {t('submit')}
                          </button>
                        </>
                      ) : (
                        <div className="status-message full">
                          <FaInfoCircle className="status-icon" />
                          <p>{t('fullNotice')}</p>
                          <button onClick={onClose} className="btn-close-full">
                            {t('close')}
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="login-prompt-card">
                <FaInfoCircle className="prompt-icon" />
                <h3>{t('loginPromptTitle')}</h3>
                <p>{t('loginPromptText')}</p>
                <button onClick={onClose} className="btn-close-prompt">{t('close')}</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutModal;