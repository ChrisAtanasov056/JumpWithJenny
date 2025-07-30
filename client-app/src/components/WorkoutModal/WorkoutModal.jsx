import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from '../../api/axius';
import './WorkoutModal.scss';

const WorkoutModal = ({ isOpen, onClose, selectedWorkout, onRegister, isLoggedIn }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [submittedWorkout, setSubmittedWorkout] = useState(null);
  const [error, setError] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && isLoggedIn && selectedWorkout) {
      resetFormStates();
      document.cookie = `user-id=${user.id}; Path=/; Domain=jumpwithjenny.com; Secure; SameSite=None`;
      checkUserRegistration();
    }
  }, [isOpen, selectedWorkout]);

  const resetFormStates = () => {
    setSelectedSize('');
    setSelectedCard('');
    setUsesOwnShoes(false);
    setSubmittedWorkout(null);
    setError('');
    setIsAlreadyRegistered(false);
    setCancelSuccess(false);
  };

  const checkUserRegistration = async () => {
    setIsCheckingRegistration(true);
    try {
      const response = await axios.get(
        `/api/Schedule/is-registered/${selectedWorkout.Id}`,
        { withCredentials: true }
      );
      setIsAlreadyRegistered(response.data);
    } catch (error) {
      console.error('Error checking registration:', error);
      setError(t('errorCheckingRegistration'));
      setIsAlreadyRegistered(false);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await axios.delete(
        `/api/Schedule/cancel-registration/${selectedWorkout.Id}`,
        { withCredentials: true }
      );
      setIsAlreadyRegistered(false);
      setCancelSuccess(true);
      setTimeout(() => {
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

  const handleSubmit = (e) => {
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

    console.log('Submitting registration:', {
      workout: selectedWorkout,
      size: selectedSize || 0,
      card: cardTypeMap[selectedCard],
      ownShoes: usesOwnShoes
    });

    setSubmittedWorkout(selectedWorkout);
    setTimeout(() => {
      onRegister(
        selectedWorkout,
        selectedSize || 0,
        cardTypeMap[selectedCard],
        usesOwnShoes
      );
      onClose();
    }, 5000);
  };

  const maxSpots = 20;
  const takenSpots = maxSpots - (selectedWorkout?.AvailableSpots ?? 0);
  const isFull = takenSpots >= maxSpots;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>

        {isLoggedIn ? (
          <>
            <h2>{t('registerFor')} {t(`days.${selectedWorkout.Day.toLowerCase()}`)} {t('at')} {selectedWorkout.Time}</h2>

            {isCheckingRegistration ? (
              <div className="loading-message">{t('checkingRegistration')}</div>
            ) : cancelSuccess ? (
              <div className="success-animation">
                <div className="checkmark">✓</div>
                <p>{t('registrationCancelled')}</p>
              </div>
            ) : isAlreadyRegistered ? (
              <div className="already-registered">
                <p>{t('alreadyRegistered')}</p>
                <button onClick={handleCancelRegistration} className="cancel-button">
                  {t('cancelRegistration')}
                </button>
              </div>
            ) : submittedWorkout && submittedWorkout.Id === selectedWorkout.Id ? (
              <div className="success-animation">
                <div className="checkmark">✓</div>
                <p>{t('registrationSuccess')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {!isFull ? (
                  <>
                    <div className="spots-info">
                      <span className={`spots-text ${isFull ? 'full' : 'available'}`}>
                        {t('spotsTaken', { taken: takenSpots, max: maxSpots })}
                      </span>
                      {isFull && <span className="full-message"> - {t('classFull')}</span>}
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={usesOwnShoes}
                          onChange={handleOwnShoesChange}
                        />
                        <span className="checkbox-custom"></span>
                        {t('useOwnShoes')}
                      </label>
                    </div>

                    {!usesOwnShoes && (
                      <div className="size-selection">
                        <label>{t('selectShoeSize')}</label>
                        <div className="size-buttons">
                        {['S', 'M', 'L', 'XL'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`size-button ${selectedSize === size ? 'active' : ''}`}
                            onClick={() => handleSizeClick(size)}
                            disabled={usesOwnShoes}
                          >
                            {size} 
                            {size === 'S' && ' (34-35)'}
                            {size === 'M' && ' (36-38)'}
                            {size === 'L' && ' (39-41)'}
                            {size === 'XL' && ' (42-44)'}
                            
                            {selectedSize === size && <span className="checkmark">✓</span>}
                          </button>
                        ))}
                        </div>
                      </div>
                    )}

                    <div className="card-selection">
                      <label htmlFor="workout-card">{t('selectCard')}</label>
                      <select
                        id="workout-card"
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

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="submit-button">
                      {t('submit')}
                    </button>
                  </>
                ) : (
                  <div className="full-notice">
                    <p>{t('fullNotice')}</p>
                    <button onClick={onClose} className="close-button">
                      {t('close')}
                    </button>
                  </div>
                )}
              </form>
            )}
          </>
        ) : (
          <div className="login-prompt">
            <h2>{t('loginPromptTitle')}</h2>
            <p>{t('loginPromptText')}</p>
            <button onClick={onClose}>{t('close')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutModal;
