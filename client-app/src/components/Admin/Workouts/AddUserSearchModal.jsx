import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useOutsideClick from '../../../services/useOutsideClick';
import useModalAccessibility from '../../../services/useModalAccessibility';
import './AddUserSearchModal.scss';

const AddUserSearchModal = ({
  visible,
  onClose,
  onConfirm,
  searchUsers,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [shoeSize, setShoeSize] = useState('');
  const [cardType, setCardType] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

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

  const handleClose = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUser(null);
    setShoeSize('');
    setCardType('');
    setUsesOwnShoes(false);
    setError('');
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  useOutsideClick(modalRef, handleClose, visible && !isSubmitting);
  useModalAccessibility({
    isOpen: visible,
    onClose: isSubmitting ? undefined : handleClose,
    modalRef,
  });

  const handleConfirm = async () => {
    if (!selectedUser || !cardType || (!usesOwnShoes && !shoeSize)) {
      setError(t('admin.workouts.addParticipantModal.validationError'));
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
      setError(typeof serverMessage === 'string' ? serverMessage : t('admin.workouts.addParticipantModal.addError'));
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="add-user-modal-overlay">
      <div
        className="add-user-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-participant-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="add-participant-title">{t('admin.workouts.addParticipantModal.title')}</h3>
        <button
          type="button"
          className="close-icon"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label={t('admin.workouts.addParticipantModal.closeAria')}
        >
          &times;
        </button>
        {!selectedUser ? (
          <>
            <input
              type="text"
              placeholder={t('admin.workouts.addParticipantModal.searchPlaceholder')}
              aria-label={t('admin.workouts.addParticipantModal.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <ul className="user-results">
              {searchResults.map(user => (
                <li key={user.Id}>
                  <span>{user.FullName} ({user.Email})</span>
                  <button type="button" onClick={() => setSelectedUser(user)}>{t('admin.workouts.addParticipantModal.selectButton')}</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="user-extra-form">
            <p><strong>{selectedUser.FullName}</strong> ({selectedUser.Email})</p>

            <div className="form-group">
              <label htmlFor="add-user-own-shoes">
                <input
                  id="add-user-own-shoes"
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
                {' '}{t('admin.workouts.addParticipantModal.usesOwnShoes')}
              </label>
            </div>

            {!usesOwnShoes && (
              <div className="form-group">
                <label htmlFor="add-user-shoe-size">{t('admin.workouts.addParticipantModal.shoeSize')}</label>
                <select
                  id="add-user-shoe-size"
                  value={shoeSize}
                  onChange={(e) => {
                    setShoeSize(e.target.value);
                    setError('');
                  }}
                >
                  <option value="" disabled>{t('admin.workouts.addParticipantModal.selectSize')}</option>
                  <option value="1">S</option>
                  <option value="2">M</option>
                  <option value="3">L</option>
                  <option value="4">XL</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="add-user-card-type">{t('admin.workouts.addParticipantModal.cardType')}</label>
              <select
                id="add-user-card-type"
                value={cardType}
                onChange={(e) => {
                  setCardType(e.target.value);
                  setError('');
                }}
              >
                <option value="" disabled>{t('admin.workouts.addParticipantModal.selectCardType')}</option>
                <option value="1">{t('admin.workouts.cardTypes.coolfit')}</option>
                <option value="2">{t('admin.workouts.cardTypes.pulse')}</option>
                <option value="3">{t('admin.workouts.cardTypes.individual')}</option>
              </select>
            </div>

            {error && <div className="error" role="alert">{error}</div>}

            <div className="form-buttons">
              <button type="button" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? t('admin.workouts.addParticipantModal.adding') : t('admin.workouts.addParticipantModal.confirm')}
              </button>
              <button type="button" onClick={handleClose} disabled={isSubmitting}>
                {t('admin.common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserSearchModal;
