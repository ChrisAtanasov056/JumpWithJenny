import React, { useState, useRef, useEffect } from "react";
import { changePassword } from "../../services/authService";
import "./ChangePasswordModal.scss";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLock, faSpinner, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';

const ChangePasswordModal = ({ onClose, userId }) => {
  const { t } = useTranslation();
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useOutsideClick(modalRef, onClose, !isLoading);
  useModalAccessibility({
    isOpen: true,
    onClose: isLoading ? undefined : onClose,
    modalRef,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError(t('change_password.errors.all_required'));
      return;
    }
    if (passwords.new.length < 8) {
      setError(t('change_password.errors.min_length'));
      return;
    }
    if (!/[A-Z]/.test(passwords.new) || !/[a-z]/.test(passwords.new) || !/[0-9]/.test(passwords.new)) {
      setError(t('change_password.errors.weak_password'));
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError(t('change_password.errors.not_matching'));
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        id: userId,
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });

      setSuccessMessage(t('change_password.success'));
      timerRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || t('change_password.errors.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cp-modal-overlay">
      <div
        ref={modalRef}
        className="change-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="change-password-title" className="title">{t('change_password.title')}</h3>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label={t('close')}
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert error" role="alert">
              <FontAwesomeIcon icon={faExclamationCircle} aria-hidden="true" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="alert success" role="status">
              <FontAwesomeIcon icon={faCheckCircle} aria-hidden="true" /> {successMessage}
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="cp-current">{t('change_password.current')}</label>
                <div className="input-icon-container">
                  <FontAwesomeIcon icon={faLock} className="input-icon" aria-hidden="true" />
                  <input
                    id="cp-current"
                    type="password"
                    autoComplete="current-password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cp-new">{t('change_password.new')}</label>
                <div className="input-icon-container">
                  <FontAwesomeIcon icon={faLock} className="input-icon" aria-hidden="true" />
                  <input
                    id="cp-new"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cp-confirm">{t('change_password.confirm')}</label>
                <div className="input-icon-container">
                  <FontAwesomeIcon icon={faLock} className="input-icon" aria-hidden="true" />
                  <input
                    id="cp-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" aria-hidden="true" />
                      {t('change_password.changing')}
                    </>
                  ) : (
                    t('change_password.update_btn')
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {t('change_password.cancel_btn')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
