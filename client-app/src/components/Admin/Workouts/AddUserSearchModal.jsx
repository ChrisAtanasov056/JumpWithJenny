import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useOutsideClick from '../../../services/useOutsideClick';
import useModalAccessibility from '../../../services/useModalAccessibility';
import './AddUserSearchModal.scss';

const isValidPhone = (phone) => {
  const trimmed = phone.trim();
  if (trimmed.length < 7 || trimmed.length > 30 || !/^\+?[0-9\s\-()]{7,30}$/.test(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const AddUserSearchModal = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setShoeSize('');
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
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (trimmedName.length < 2) {
      setError(t('bookingForm.errorFullName'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t('bookingForm.errorEmail'));
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setError(t('bookingForm.errorPhone'));
      return;
    }

    if (!usesOwnShoes && !shoeSize) {
      setError(t('admin.workouts.addParticipantModal.validationError'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onConfirm({
        fullName: trimmedName,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        shoeSize: usesOwnShoes ? null : parseInt(shoeSize, 10),
        usesOwnShoes,
      });
      handleClose();
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
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

        <div className="user-extra-form">
          <div className="form-group">
            <label htmlFor="add-participant-name">{t('bookingForm.fullNameLabel')}</label>
            <input
              id="add-participant-name"
              type="text"
              placeholder={t('bookingForm.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label htmlFor="add-participant-email">{t('bookingForm.emailLabel')}</label>
            <input
              id="add-participant-email"
              type="email"
              placeholder={t('bookingForm.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              maxLength={254}
            />
          </div>

          <div className="form-group">
            <label htmlFor="add-participant-phone">{t('bookingForm.phoneLabel')}</label>
            <input
              id="add-participant-phone"
              type="tel"
              placeholder={t('bookingForm.phonePlaceholder')}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError('');
              }}
              maxLength={30}
            />
          </div>

          <div className="form-group checkbox-group">
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
              <span>{t('admin.workouts.addParticipantModal.usesOwnShoes')}</span>
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
                <option value="1">S (36-38)</option>
                <option value="2">M (39-41)</option>
                <option value="3">L (42-44)</option>
                <option value="4">XL (44-46)</option>
              </select>
            </div>
          )}

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
      </div>
    </div>
  );
};

export default AddUserSearchModal;
