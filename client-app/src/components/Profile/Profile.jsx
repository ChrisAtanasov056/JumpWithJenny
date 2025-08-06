import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { resendVerificationEmail, verifyEmail } from "../../services/authService";
import ChangePasswordModal from "../ChangePassword/ChangePasswordModal";
import "./ProfileModal.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faEnvelope, faCheckCircle, faExclamationCircle, faLock, faSignOutAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ProfileModal = ({ onClose, user, onLogout }) => {
  const { t } = useTranslation();
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [localUser, setLocalUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail(localUser.id, localUser.token);
      setLocalUser((prevUser) => ({ ...prevUser, EmailConfirmed: true }));
      setVerificationMessage(t("profile.emailVerified"));
    } catch (error) {
      setVerificationMessage(t("profile.emailVerificationFailed"));
    }
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-card">
        <div className="modal-header">
          <h2 className="title">{t("profile.title")}</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="profile-info-section">
          <div className="profile-detail">
            <FontAwesomeIcon icon={faUser} className="detail-icon" />
            <div className="detail-content">
              <span className="label">{t("profile.username")}</span>
              <span className="value">{localUser.username || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon icon={faUser} className="detail-icon" />
            <div className="detail-content">
              <span className="label">{t("profile.name")}</span>
              <span className="value">{[localUser.firstname, localUser.lastname].filter(Boolean).join(" ") || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon icon={faEnvelope} className="detail-icon" />
            <div className="detail-content">
              <span className="label">{t("profile.email")}</span>
              <span className="value">{localUser.email || t("profile.notAvailable")}</span>
            </div>
          </div>
          <div className="profile-detail">
            <FontAwesomeIcon 
              icon={localUser.emailConfirmed ? faCheckCircle : faExclamationCircle} 
              className={`detail-icon ${localUser.emailConfirmed ? 'verified' : 'not-verified'}`} 
            />
            <div className="detail-content">
              <span className="label">{t("profile.verified")}</span>
              <span className="value">{localUser.emailConfirmed ? t("profile.yes") : t("profile.no")}</span>
            </div>
          </div>

          {!localUser.emailConfirmed && (
            <div className="verification-status-box">
              <p className="message">{verificationMessage || t("profile.verificationPending")}</p>
              <button className="btn resend-btn" onClick={handleResendVerification} disabled={isLoading}>
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                ) : (
                  <FontAwesomeIcon icon={faEnvelope} className="btn-icon" />
                )}
                {t("profile.resendVerificationEmail")}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn change-password-btn" onClick={() => setPasswordModalOpen(true)}>
            <FontAwesomeIcon icon={faLock} className="btn-icon" />
            {t("profile.changePassword")}
          </button>
          <button className="btn logout-btn" onClick={onLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="btn-icon" />
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