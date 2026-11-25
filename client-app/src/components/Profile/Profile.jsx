import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { resendVerificationEmail } from "../../services/authService";
import ChangePasswordModal from "../ChangePassword/ChangePasswordModal";
import "./ProfileModal.scss";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationCircle,
  FaLock,
  FaSignOutAlt,
  FaSpinner,
} from 'react-icons/fa';

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
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="profile-info-section">
          <div className="profile-detail">
            <FaUser className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.username")}</span>
              <span className="value">{localUser.username || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FaUser className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.name")}</span>
              <span className="value">
                {[localUser.firstname, localUser.lastname].filter(Boolean).join(" ") ||
                  t("profile.notAvailable")}
              </span>
            </div>
          </div>
          <div className="profile-detail">
            <FaEnvelope className="detail-icon" aria-hidden="true" />
            <div className="detail-content">
              <span className="label">{t("profile.email")}</span>
              <span className="value">{localUser.email || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            {localUser.emailConfirmed ? (
              <FaCheckCircle className="detail-icon verified" aria-hidden="true" />
            ) : (
              <FaExclamationCircle className="detail-icon not-verified" aria-hidden="true" />
            )}
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
                  <FaSpinner className="fa-spin" aria-hidden="true" />
                ) : (
                  <FaEnvelope className="btn-icon" aria-hidden="true" />
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
            <FaLock className="btn-icon" aria-hidden="true" />
            {t("profile.changePassword")}
          </button>
          <button type="button" className="btn logout-btn" onClick={onLogout}>
            <FaSignOutAlt className="btn-icon" aria-hidden="true" />
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
