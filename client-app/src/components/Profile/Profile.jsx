import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { resendVerificationEmail } from "../../services/authService";
import ChangePasswordModal from "../ChangePassword/ChangePasswordModal";
import "./ProfileModal.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faUser,
  faEnvelope,
  faCheckCircle,
  faExclamationCircle,
  faLock,
  faSignOutAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';

const ProfileModal = ({ onClose, user, onLogout }) => {
  const { t } = useTranslation();
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [localUser, setLocalUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

  const modalCardRef = useRef(null);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useOutsideClick(modalCardRef, onClose, !isPasswordModalOpen);
  useModalAccessibility({ isOpen: Boolean(localUser), onClose, modalRef: modalCardRef });

  if (!localUser) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsLoading(true);
    setVerificationMessage("");
    try {
      await resendVerificationEmail(localUser.email, i18n.language);
      setVerificationMessage(t("profile.verificationEmailSent"));
    } catch (error) {
      setVerificationMessage(t("profile.verificationEmailFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay">
      <div
        className="profile-modal-card"
        ref={modalCardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="profile-modal-title" className="title">{t("profile.title")}</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label={t("close")}
          >
            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
          </button>
        </div>

        <div className="profile-info-section">
          <div className="profile-detail">
            <FontAwesomeIcon icon={faUser} className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.username")}</span>
              <span className="value">{localUser.username || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon icon={faUser} className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.name")}</span>
              <span className="value">
                {[localUser.firstname, localUser.lastname].filter(Boolean).join(" ") ||
                  t("profile.notAvailable")}
              </span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon icon={faEnvelope} className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.email")}</span>
              <span className="value">{localUser.email || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon
              icon={localUser.emailConfirmed ? faCheckCircle : faExclamationCircle}
              className={`detail-icon ${localUser.emailConfirmed ? 'verified' : 'not-verified'}`}
              aria-hidden="true"
            />
            <div className="detail-content">
              <span className="label">{t("profile.verified")}</span>
              <span className="value">
                {localUser.emailConfirmed ? t("profile.yes") : t("profile.no")}
              </span>
            </div>
          </div>

          {!localUser.emailConfirmed && (
            <div className="verification-status-box">
              <p className="message">{verificationMessage || t("profile.verificationPending")}</p>
              <button
                type="button"
                className="btn resend-btn"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" aria-hidden="true" />
                ) : (
                  <FontAwesomeIcon icon={faEnvelope} className="btn-icon" aria-hidden="true" />
                )}
                {t("profile.resendVerificationEmail")}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn change-password-btn"
            onClick={() => setPasswordModalOpen(true)}
          >
            <FontAwesomeIcon icon={faLock} className="btn-icon" aria-hidden="true" />
            {t("profile.changePassword")}
          </button>
          <button type="button" className="btn logout-btn" onClick={onLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="btn-icon" aria-hidden="true" />
            {t("profile.logout")}
          </button>
        </div>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordModalOpen(false)}
          userId={localUser.id}
        />
      )}
    </div>
  );
};

export default ProfileModal;
