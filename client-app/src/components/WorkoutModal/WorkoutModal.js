import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/AuthContext';
import axios from 'axios';
import './WorkoutModal.scss';

const WorkoutModal = ({ isOpen, onClose, selectedWorkout, onRegister, isLoggedIn }) => {
  // Form states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  
  // Status states
  const [submittedWorkout, setSubmittedWorkout] = useState(null);
  const [error, setError] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && isLoggedIn && selectedWorkout) {
      resetFormStates();
      document.cookie = `user-id=${user.id}; Path=/; Secure; SameSite=None`;
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
        `https://localhost:7024/api/Schedule/is-registered/${selectedWorkout.Id}`,
        { withCredentials: true }
      );
      setIsAlreadyRegistered(response.data);
    } catch (error) {
      console.error('Error checking registration:', error);
      setError('Failed to check registration status');
      setIsAlreadyRegistered(false);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await axios.delete(
        `https://localhost:7024/api/Schedule/cancel-registration/${selectedWorkout.Id}`,
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
      setError('Failed to cancel registration');
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
      setError('Please select a shoe size or choose to use your own shoes.');
      return;
    }
    if (!selectedCard) {
      setError('Please select a workout card type.');
      return;
    }

    const cardTypeMap = {
      'CoolFit Card': 0,
      'Pulse Fitness Card': 1,
      'Individual Workout': 2
    }

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

  // Calculate spots information
  const maxSpots = 20;
  const takenSpots = maxSpots - (selectedWorkout?.AvailableSpots ?? 0);
  const spotsText = `${takenSpots}/${maxSpots}`;
  const isFull = takenSpots >= maxSpots;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        
        {isLoggedIn ? (
          <>
            <h2>Register for {selectedWorkout.Day} at {selectedWorkout.Time}</h2>
            
            
            {/* Status Flow */}
            {isCheckingRegistration ? (
              <div className="loading-message">Checking registration status...</div>
            ) : cancelSuccess ? (
              <div className="success-animation">
                <div className="checkmark">✓</div>
                <p>Registration cancelled successfully!</p>
              </div>
            ) : isAlreadyRegistered ? (
              <div className="already-registered">
                <p>You are already registered for this workout.</p>
                <button 
                  onClick={handleCancelRegistration}
                  className="cancel-button"
                >
                  Cancel Registration
                </button>
              </div>
            ) : submittedWorkout && submittedWorkout.Id === selectedWorkout.Id ? (
              <div className="success-animation">
                <div className="checkmark">✓</div>
                <p>Registration successful!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {!isFull ? (
                  <>
                    <div className="spots-info">
                      <span className={`spots-text ${isFull ? 'full' : 'available'}`}>
                        {spotsText} spots taken
                      </span>
                      {isFull && <span className="full-message"> - Class full</span>}
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={usesOwnShoes}
                          onChange={handleOwnShoesChange}
                        />
                        <span className="checkbox-custom"></span>
                        I will use my own shoes
                      </label>
                    </div>

                    {!usesOwnShoes && (
                      <div className="size-selection">
                        <label>Select Kangoo Jump Shoe Size:</label>
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
                              {selectedSize === size && <span className="checkmark">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="card-selection">
                      <label htmlFor="workout-card">Select Workout Card:</label>
                      <select
                        id="workout-card"
                        value={selectedCard}
                        onChange={handleCardChange}
                        required
                      >
                        <option value="" disabled>Select card type</option>
                        <option value="CoolFit Card">CoolFit Card</option>
                        <option value="Pulse Fitness Card">Pulse Fitness Card</option>
                        <option value="Individual Workout">Individual Workout</option>
                      </select>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="submit-button">
                      Register
                    </button>
                  </>
                ) : (
                  <div className="full-notice">
                    <p>This class has reached maximum capacity.</p>
                    <button onClick={onClose} className="close-button">
                      Close
                    </button>
                  </div>
                )}
              </form>
            )}
          </>
        ) : (
          <div className="login-prompt">
            <h2>Please Log In</h2>
            <p>You need to be logged in to register for this workout.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutModal;