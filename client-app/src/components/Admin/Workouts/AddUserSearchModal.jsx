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

  const handleConfirm = () => {
    if (selectedUser && cardType && (usesOwnShoes || shoeSize)) {
      onConfirm({
        userId: selectedUser.Id,
        shoeSize: usesOwnShoes ? null : parseInt(shoeSize),
        cardType: parseInt(cardType),
        usesOwnShoes,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setShoeSize('');
    setCardType('');
    setUsesOwnShoes(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="add-user-modal-overlay">
      <div className="add-user-modal">
        <h3>Add Participant</h3>
        <button className="close-icon" onClick={onClose}>
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
                  <button onClick={() => setSelectedUser(user)}>Select</button>
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
                  onChange={(e) => setUsesOwnShoes(e.target.checked)}
                />
                {' '}Participant uses own shoes
              </label>
            </div>

            {!usesOwnShoes && (
              <div className="form-group">
                <label>Shoe Size</label>
                <select value={shoeSize} onChange={(e) => setShoeSize(e.target.value)}>
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
              <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
                <option value="" disabled>Select card type</option>
                <option value="1">CoolFit</option>
                <option value="2">PulseCard</option>
                <option value="3">IndividualWorkout</option>
              </select>
            </div>

            <div className="form-buttons">
              <button onClick={handleConfirm}>Confirm</button>
              <button onClick={handleClose}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserSearchModal;
