import React, { useState, useEffect } from 'react';
import './AddUserSearchModal.scss';

const AddUserSearchModal = ({
  visible,
  onClose,
  onConfirm,
  searchUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [shoeSize, setShoeSize] = useState('');
  const [cardType, setCardType] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim()) {
        const users = await searchUsers(searchTerm);
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchUsers]);

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setShoeSize('');
    setCardType('');
    setUsesOwnShoes(false);
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selectedUser || !cardType || (!usesOwnShoes && !shoeSize)) {
      setError('Please select a card type and shoe size.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onConfirm({
        userId: selectedUser.Id,
        shoeSize: usesOwnShoes ? null : parseInt(shoeSize, 10),
        cardType: parseInt(cardType, 10),
        usesOwnShoes,
      });
      handleClose();
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data || err.message;
      setError(typeof serverMessage === 'string' ? serverMessage : 'Failed to add participant.');
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="add-user-modal-overlay">
      <div className="add-user-modal">
        <h3>Add Participant</h3>
        <button type="button" className="close-icon" onClick={handleClose}>
          &times;
        </button>
        {!selectedUser ? (
          <>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <ul className="user-results">
              {searchResults.map(user => (
                <li key={user.Id}>
                  <span>{user.FullName} ({user.Email})</span>
                  <button type="button" onClick={() => setSelectedUser(user)}>Select</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="user-extra-form">
            <p><strong>{selectedUser.FullName}</strong> ({selectedUser.Email})</p>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={usesOwnShoes}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUsesOwnShoes(checked);
                    if (checked) {
                      setShoeSize('');
                    }
                    setError('');
                  }}
                />
                {' '}Participant uses own shoes
              </label>
            </div>

            {!usesOwnShoes && (
              <div className="form-group">
                <label>Shoe Size</label>
                <select
                  value={shoeSize}
                  onChange={(e) => {
                    setShoeSize(e.target.value);
                    setError('');
                  }}
                >
                  <option value="" disabled>Select size</option>
                  <option value="1">S</option>
                  <option value="2">M</option>
                  <option value="3">L</option>
                  <option value="4">XL</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Card Type</label>
              <select
                value={cardType}
                onChange={(e) => {
                  setCardType(e.target.value);
                  setError('');
                }}
              >
                <option value="" disabled>Select card type</option>
                <option value="1">CoolFit</option>
                <option value="2">PulseCard</option>
                <option value="3">IndividualWorkout</option>
              </select>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-buttons">
              <button type="button" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Confirm'}
              </button>
              <button type="button" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserSearchModal;
