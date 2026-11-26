import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaUserCheck } from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import useOutsideClick from '../../../services/useOutsideClick';
import useModalAccessibility from '../../../services/useModalAccessibility';
import './ParticipantFormModal.scss';

const SHOE_OPTIONS = [
  { size: 1, label: 'S', range: '36–38' },
  { size: 2, label: 'M', range: '39–41' },
  { size: 3, label: 'L', range: '42–44' },
  { size: 4, label: 'XL', range: '44–46' },
];

const isValidPhone = (phone) => {
  const trimmed = phone.trim();
  if (trimmed.length < 7 || trimmed.length > 30 || !/^\+?[0-9\s\-()]{7,30}$/.test(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

const ParticipantFormModal = ({
  visible,
  mode = 'add',
  initialParticipant = null,
  workout = null,
  onClose,
  onConfirm,
}) => {
  const { t, i18n } = useTranslation();
  const isEdit = mode === 'edit' && Boolean(initialParticipant);
  const modalRef = useRef(null);

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [shoeSize, setShoeSize] = useState('');
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const freeShoesBySize = useMemo(() => {
    const map = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const ws of workout?.WorkoutShoes || []) {
      const s = Number(ws.Shoe?.Size);
      if (!ws.IsDeleted && !ws.IsTaken && map[s] !== undefined) {
        map[s] += 1;
      }
    }
    return map;
  }, [workout]);

  const needsOverbooking =
    !isEdit &&
    Boolean(workout) &&
    (Number(workout.AvailableSpots ?? 0) <= 0 ||
      String(workout.Status || '').toLowerCase() !== 'available');

  useEffect(() => {
    if (!visible) return;

    if (isEdit && initialParticipant) {
      setFullName(initialParticipant.FullName || initialParticipant.UserFullName || '');
      setPhoneNumber(initialParticipant.PhoneNumber || '');
      setEmail(initialParticipant.Email || initialParticipant.UserEmail || '');
      setUsesOwnShoes(Boolean(initialParticipant.UsesOwnShoes));
      setShoeSize(
        !initialParticipant.UsesOwnShoes && initialParticipant.ShoeSize
          ? String(Number(initialParticipant.ShoeSize))
          : ''
      );
      setSendConfirmationEmail(false);
      setAllowOverbooking(false);
    } else {
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setUsesOwnShoes(false);
      setShoeSize('');
      setSendConfirmationEmail(false);
      setAllowOverbooking(Boolean(needsOverbooking));
    }

    setAutocompleteQuery('');
    setSuggestions([]);
    setError('');
    setIsSubmitting(false);
  }, [visible, isEdit, initialParticipant, needsOverbooking]);

  useEffect(() => {
    if (!visible || isEdit) return;
    const trimmed = autocompleteQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingClients(true);
      try {
        const results = await WorkoutService.autocompleteClients(trimmed);
        if (!cancelled) {
          setSuggestions(Array.isArray(results) ? results : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingClients(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autocompleteQuery, visible, isEdit]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  useOutsideClick(modalRef, handleClose, visible && !isSubmitting);
  useModalAccessibility({
    isOpen: visible,
    onClose: isSubmitting ? undefined : handleClose,
    modalRef,
  });

  const handlePickSuggestion = (client) => {
    setFullName(client.FullName || '');
    setPhoneNumber(client.PhoneNumber || '');
    setEmail(client.Email || '');

    if (client.UsesOwnShoesMostly) {
      setUsesOwnShoes(true);
      setShoeSize('');
    } else {
      setUsesOwnShoes(false);
      const preferred = Number(client.PreferredShoeSize);
      if (preferred && freeShoesBySize[preferred] > 0) {
        setShoeSize(String(preferred));
      } else {
        setShoeSize('');
      }
    }

    setAutocompleteQuery('');
    setSuggestions([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setError(t('bookingForm.errorFullName'));
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setError(t('bookingForm.errorPhone'));
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t('bookingForm.errorEmail'));
      return;
    }

    if (!usesOwnShoes && !shoeSize) {
      setError(t('admin.workouts.addParticipantModal.validationError'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const activeLang = (i18n.resolvedLanguage || i18n.language || 'bg').split('-')[0];
      await onConfirm({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        email: trimmedEmail || null,
        shoeSize: usesOwnShoes ? null : parseInt(shoeSize, 10),
        usesOwnShoes,
        sendConfirmationEmail: Boolean(!isEdit && trimmedEmail && sendConfirmationEmail),
        allowOverbooking: Boolean(!isEdit && allowOverbooking),
        language: activeLang,
      });
      onClose();
    } catch (err) {
      const errorCode = err?.response?.data?.code;
      const translatedByCode = errorCode
        ? t(`bookingErrors.${errorCode}`, { defaultValue: '' })
        : '';
      const serverMessage =
        translatedByCode ||
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message;
      setError(
        typeof serverMessage === 'string' && serverMessage
          ? serverMessage
          : t(
              isEdit
                ? 'admin.workouts.addParticipantModal.updateError'
                : 'admin.workouts.addParticipantModal.addError'
            )
      );
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  const currentParticipantSize =
    isEdit && !initialParticipant?.UsesOwnShoes && initialParticipant?.ShoeSize
      ? Number(initialParticipant.ShoeSize)
      : null;

  return (
    <div className="adm-modal-overlay" role="presentation">
      <div
        ref={modalRef}
        className="adm-modal-dialog participant-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-header">
          <h3 id="participant-modal-title">
            {isEdit
              ? t('admin.workouts.addParticipantModal.editTitle')
              : t('admin.workouts.addParticipantModal.title')}
          </h3>
          <button
            type="button"
            className="adm-modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t('admin.workouts.addParticipantModal.closeAria')}
          >
            &times;
          </button>
        </div>

        {!isEdit && (
          <div className="autocomplete-box">
            <label htmlFor="client-autocomplete-input">
              {t('admin.workouts.addParticipantModal.autocompleteLabel')}
            </label>
            <div className="adm-search-field">
              <FaSearch className="adm-search-icon" aria-hidden="true" />
              <input
                id="client-autocomplete-input"
                type="text"
                className="adm-input"
                placeholder={t('admin.workouts.addParticipantModal.autocompletePlaceholder')}
                value={autocompleteQuery}
                onChange={(e) => setAutocompleteQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            {searchingClients && (
              <div className="autocomplete-status">{t('admin.common.loading')}</div>
            )}

            {suggestions.length > 0 && (
              <div className="autocomplete-dropdown" role="listbox">
                {suggestions.map((client) => (
                  <button
                    key={client.ClientKey}
                    type="button"
                    className="autocomplete-item"
                    onClick={() => handlePickSuggestion(client)}
                  >
                    <div className="ac-main">
                      <strong>{client.FullName}</strong>
                      <span>
                        {client.PhoneNumber}
                        {client.Email ? ` · ${client.Email}` : ''}
                      </span>
                    </div>
                    <span className="ac-badge tabular-nums">
                      <FaUserCheck aria-hidden="true" />{' '}
                      {t('admin.workouts.addParticipantModal.previousVisits', {
                        count: client.TotalBookings,
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="participant-form">
          <div className="form-field">
            <label htmlFor="participant-name">{t('bookingForm.fullNameLabel')} *</label>
            <input
              id="participant-name"
              type="text"
              className="adm-input"
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

          <div className="form-field">
            <label htmlFor="participant-phone">{t('bookingForm.phoneLabel')} *</label>
            <input
              id="participant-phone"
              type="tel"
              className="adm-input"
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

          <div className="form-field">
            <label htmlFor="participant-email">
              {t('admin.workouts.addParticipantModal.emailOptionalLabel')}
            </label>
            <input
              id="participant-email"
              type="email"
              className="adm-input"
              placeholder={t('bookingForm.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              maxLength={254}
            />
            <span className="field-hint">
              {t('admin.workouts.addParticipantModal.emailOptionalHint')}
            </span>
          </div>

          {!isEdit && email.trim().length > 0 && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={sendConfirmationEmail}
                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
              />
              <span>{t('admin.workouts.addParticipantModal.sendConfirmationEmail')}</span>
            </label>
          )}

          <div className="shoes-picker-section">
            <label className="checkbox-row own-shoes-toggle">
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
              <span>{t('admin.workouts.addParticipantModal.usesOwnShoes')}</span>
            </label>

            {!usesOwnShoes && (
              <div className="shoe-size-grid" role="radiogroup" aria-label={t('admin.workouts.addParticipantModal.shoeSize')}>
                {SHOE_OPTIONS.map((opt) => {
                  const freeCount = freeShoesBySize[opt.size] ?? 0;
                  const isOwnCurrent = currentParticipantSize === opt.size;
                  const disabled = workout ? freeCount <= 0 && !isOwnCurrent : false;
                  const selected = Number(shoeSize) === opt.size;

                  return (
                    <button
                      key={opt.size}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={disabled}
                      className={`shoe-size-card${selected ? ' selected' : ''}${disabled ? ' depleted' : ''}`}
                      onClick={() => {
                        setShoeSize(String(opt.size));
                        setError('');
                      }}
                    >
                      <span className="size-letter">{opt.label}</span>
                      <span className="size-eu">{opt.range}</span>
                      {workout && (
                        <span className="size-free tabular-nums">
                          {disabled
                            ? t('admin.workouts.addParticipantModal.noFreeSize')
                            : t('admin.workouts.addParticipantModal.freeCount', {
                                count: isOwnCurrent && freeCount === 0 ? 1 : freeCount,
                              })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {needsOverbooking && (
            <div className="adm-alert adm-alert--warning overbooking-box">
              <div>
                {t('admin.workouts.addParticipantModal.overbookingNotice', {
                  status: t(`admin.workouts.statuses.${String(workout.Status || '').toLowerCase()}`, {
                    defaultValue: workout.Status,
                  }),
                })}
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={allowOverbooking}
                  onChange={(e) => setAllowOverbooking(e.target.checked)}
                />
                <span>{t('admin.workouts.addParticipantModal.allowOverbooking')}</span>
              </label>
            </div>
          )}

          {error && <div className="adm-alert adm-alert--error" role="alert">{error}</div>}

          <div className="modal-footer-actions">
            <button
              type="button"
              className="adm-btn adm-btn--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('admin.common.cancel')}
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t(
                    isEdit
                      ? 'admin.workouts.addParticipantModal.saving'
                      : 'admin.workouts.addParticipantModal.adding'
                  )
                : t(
                    isEdit
                      ? 'admin.workouts.addParticipantModal.saveConfirm'
                      : 'admin.workouts.addParticipantModal.confirm'
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantFormModal;
