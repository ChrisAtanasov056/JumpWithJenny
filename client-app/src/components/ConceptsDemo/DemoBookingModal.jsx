import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FaTimes, FaCheck, FaShoePrints, FaCalendarAlt, FaMagic } from 'react-icons/fa';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';
import { loadBookingPreferences, saveBookingPreferences } from '../../utils/bookingStorage';
import { formatWorkoutDateBg } from '../../utils/workoutDate';
import { SHOE_SIZES, VISIT_TYPES } from './demoData';
import './DemoBookingModal.scss';

const computeShoeCounts = (workout) => {
  const counts = { S: 0, M: 0, L: 0, XL: 0 };
  if (!workout?.WorkoutShoes) return counts;

  workout.WorkoutShoes.forEach((ws) => {
    if (!ws.IsTaken && ws.Shoe) {
      const match = SHOE_SIZES.find((s) => s.code === ws.Shoe.Size);
      if (match) counts[match.key] += 1;
    }
  });
  return counts;
};

const DemoBookingModal = ({
  isOpen,
  onClose,
  workout,
  concept,
  lang,
  copy,
  isBookedByUser,
  userBookingInfo,
  onBookSuccess,
  onCancelBooking,
}) => {
  const modalRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useOutsideClick(modalRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef });

  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [usesOwnShoes, setUsesOwnShoes] = useState(false);
  const [visitType, setVisitType] = useState('coolfit');
  const [error, setError] = useState('');
  const [stepState, setStepState] = useState('form'); // 'form' | 'success' | 'cancelled'

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const shoeCounts = useMemo(() => computeShoeCounts(workout), [workout]);
  const availableSizes = useMemo(
    () => SHOE_SIZES.filter((size) => (shoeCounts[size.key] ?? 0) > 0),
    [shoeCounts]
  );

  useEffect(() => {
    if (!isOpen || !workout) {
      setError('');
      setStepState('form');
      return;
    }

    const prefs = loadBookingPreferences();
    setFullName(prefs.fullName || '');
    setEmail(prefs.email || '');
    setPhoneNumber(prefs.phoneNumber || '');
    setUsesOwnShoes(Boolean(prefs.usesOwnShoes));
    setSelectedSize(
      !prefs.usesOwnShoes && prefs.shoeSize && shoeCounts[prefs.shoeSize] > 0
        ? prefs.shoeSize
        : ''
    );
    setError('');
    setStepState('form');
  }, [isOpen, workout?.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDemoAutofill = () => {
    setFullName(lang === 'bg' ? 'Елена Василева' : 'Elena Vasileva');
    setEmail('elena.demo@jumpwithjenny.com');
    setPhoneNumber('0888 123 456');
    if (!usesOwnShoes && !selectedSize && availableSizes.length > 0) {
      setSelectedSize(availableSizes[0].key);
    }
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    if (trimmedName.length < 2) {
      setError(copy.modal.errName);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(copy.modal.errEmail);
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 7) {
      setError(copy.modal.errPhone);
      return;
    }
    if (!usesOwnShoes && !selectedSize) {
      setError(copy.modal.errShoe);
      return;
    }

    saveBookingPreferences({
      fullName: trimmedName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      shoeSize: usesOwnShoes ? undefined : selectedSize,
      usesOwnShoes,
    });

    onBookSuccess(workout.Id, {
      fullName: trimmedName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      shoeSize: usesOwnShoes ? null : selectedSize,
      usesOwnShoes,
      visitType,
    });

    setStepState('success');
  };

  const handleCancelDemo = () => {
    onCancelBooking(workout.Id);
    setStepState('cancelled');
  };

  const taken = workout?.TakenSpots ?? 0;
  const total = workout?.TotalSpots || (taken + (workout?.AvailableSpots ?? 0)) || 12;
  const percent = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
  const dayLabel = workout?.Day ? copy.schedule.days[workout.Day] || workout.Day : '';

  const dialogInitial = prefersReducedMotion
    ? { opacity: 0 }
    : isMobileViewport
      ? { y: '100%', opacity: 0.9 }
      : { opacity: 0, scale: 0.96, y: 12 };

  const dialogAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : isMobileViewport
      ? { y: 0, opacity: 1 }
      : { opacity: 1, scale: 1, y: 0 };

  const dialogExit = prefersReducedMotion
    ? { opacity: 0 }
    : isMobileViewport
      ? { y: '100%', opacity: 0.9 }
      : { opacity: 0, scale: 0.96, y: 8 };

  const dialogTransition = prefersReducedMotion
    ? { duration: 0.14 }
    : isMobileViewport
      ? { duration: 0.36, ease: [0.32, 0.72, 0, 1] }
      : { duration: 0.24, ease: [0.23, 1, 0.32, 1] };

  return (
    <AnimatePresence>
      {isOpen && workout && (
        <motion.div
          className={`jwj-demo-modal-backdrop concept-${concept}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.div
            ref={modalRef}
            className={`jwj-demo-modal concept-${concept}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-booking-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={dialogInitial}
            animate={dialogAnimate}
            exit={dialogExit}
            transition={dialogTransition}
          >
            <div className="modal-grab-bar" aria-hidden="true" />

            <div className="modal-top">
              <div>
                <span className="modal-kicker">
                  <FaCalendarAlt aria-hidden="true" /> {copy.modal.title}
                </span>
                <h2 id="demo-booking-modal-title" className="modal-heading">
                  {dayLabel} · <span className="tabular-nums">{workout.Time}</span>
                </h2>
                <p className="modal-date-line">{formatWorkoutDateBg(workout.Date)}</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label={copy.modal.close}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {stepState === 'success' ? (
              <div className="modal-status-panel is-success" role="status">
                <div className="status-badge-circle">
                  <FaCheck aria-hidden="true" />
                </div>
                <h3>{copy.modal.successTitle}</h3>
                <p>{copy.modal.successNote.replace('{{email}}', email)}</p>
                <div className="booking-recap">
                  <div>
                    <span>{copy.cancelPreview.dateLabel}:</span>
                    <strong>
                      {dayLabel}, {workout.Time} ({formatWorkoutDateBg(workout.Date)})
                    </strong>
                  </div>
                  <div>
                    <span>{copy.cancelPreview.shoesLabel}:</span>
                    <strong>
                      {usesOwnShoes
                        ? copy.modal.ownShoes
                        : selectedSize}
                    </strong>
                  </div>
                </div>
                <div className="status-actions">
                  <button type="button" className="btn-demo-primary" onClick={onClose}>
                    {copy.modal.close}
                  </button>
                </div>
              </div>
            ) : stepState === 'cancelled' ? (
              <div className="modal-status-panel" role="status">
                <div className="status-badge-circle">
                  <FaCheck aria-hidden="true" />
                </div>
                <h3>{copy.modal.cancelledTitle}</h3>
                <div className="status-actions">
                  <button type="button" className="btn-demo-primary" onClick={onClose}>
                    {copy.modal.close}
                  </button>
                </div>
              </div>
            ) : isBookedByUser ? (
              <div className="modal-status-panel">
                <h3>{copy.modal.alreadyTitle}</h3>
                <div className="booking-recap">
                  <div>
                    <span>{copy.modal.fullName}:</span>
                    <strong>{userBookingInfo?.fullName || 'Елена Василева'}</strong>
                  </div>
                  <div>
                    <span>{copy.cancelPreview.shoesLabel}:</span>
                    <strong>
                      {userBookingInfo?.usesOwnShoes
                        ? copy.modal.ownShoes
                        : userBookingInfo?.shoeSize || 'M'}
                    </strong>
                  </div>
                </div>
                <div className="status-actions">
                  <button type="button" className="btn-demo-danger" onClick={handleCancelDemo}>
                    {copy.modal.cancelMine}
                  </button>
                  <button type="button" className="btn-demo-ghost" onClick={onClose}>
                    {copy.modal.close}
                  </button>
                </div>
              </div>
            ) : (
              <form className="modal-booking-form" onSubmit={handleSubmit} noValidate>
                <div className="modal-capacity-bar">
                  <div className="capacity-labels">
                    <span>
                      {copy.schedule.takenOf
                        .replace('{{taken}}', taken)
                        .replace('{{total}}', total)}
                    </span>
                    <strong className="tabular-nums">
                      {workout.AvailableSpots}{' '}
                      {workout.AvailableSpots === 1
                        ? copy.schedule.spotLeftSingular
                        : copy.schedule.spotsLeft}
                    </strong>
                  </div>
                  <div className="capacity-track" aria-hidden="true">
                    <div className="capacity-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="form-block">
                  <div className="form-block-header">
                    <h3>{copy.modal.contactSection}</h3>
                    <button
                      type="button"
                      className="btn-autofill-chip"
                      onClick={handleDemoAutofill}
                    >
                      <FaMagic aria-hidden="true" /> {copy.modal.autofillDemo}
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="field-group">
                      <label htmlFor="demo-fullname">{copy.modal.fullName}</label>
                      <input
                        id="demo-fullname"
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        placeholder={copy.modal.fullNamePlaceholder}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setError('');
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="demo-email">{copy.modal.email}</label>
                      <input
                        id="demo-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        placeholder={copy.modal.emailPlaceholder}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="demo-phone">{copy.modal.phone}</label>
                      <input
                        id="demo-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phoneNumber}
                        placeholder={copy.modal.phonePlaceholder}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setError('');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-block">
                  <div className="form-block-header">
                    <h3>
                      <FaShoePrints aria-hidden="true" /> {copy.modal.shoesSection}
                    </h3>
                    <label className="own-shoes-toggle" htmlFor="demo-own-shoes">
                      <input
                        id="demo-own-shoes"
                        type="checkbox"
                        checked={usesOwnShoes}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUsesOwnShoes(checked);
                          if (checked) setSelectedSize('');
                          setError('');
                        }}
                      />
                      <span>{copy.modal.ownShoes}</span>
                    </label>
                  </div>

                  {!usesOwnShoes && (
                    availableSizes.length > 0 ? (
                      <div className="shoe-size-grid">
                        {availableSizes.map((size) => {
                          const count = shoeCounts[size.key];
                          const isSelected = selectedSize === size.key;
                          return (
                            <button
                              key={size.key}
                              type="button"
                              aria-pressed={isSelected}
                              className={`shoe-pill-btn ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setSelectedSize(size.key);
                                setError('');
                              }}
                            >
                              <span className="shoe-letter">{size.key}</span>
                              <span className="shoe-eu">{size.eu}</span>
                              <span className="shoe-count">
                                {copy.modal.availableCount.replace('{{count}}', count)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="no-shoes-msg">{copy.schedule.onlyOwnShoes}</p>
                    )
                  )}
                </div>

                <div className="form-block">
                  <div className="form-block-header">
                    <h3>{copy.modal.visitTypeSection}</h3>
                  </div>
                  <div className="visit-type-row">
                    {VISIT_TYPES.map((vt) => (
                      <button
                        key={vt.id}
                        type="button"
                        aria-pressed={visitType === vt.id}
                        className={`visit-pill ${visitType === vt.id ? 'is-selected' : ''}`}
                        onClick={() => setVisitType(vt.id)}
                      >
                        {copy.modal[vt.key]}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="modal-error-banner" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-demo-primary btn-submit-full">
                  {copy.modal.submit}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoBookingModal;
