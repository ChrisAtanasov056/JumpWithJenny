import React, { useState } from "react";
import { useTranslation } from "react-i18next"; // Add this import
import { resendVerificationEmail, verifyEmail } from "../../services/authService";
import ChangePasswordModal from "../ChangePassword/ChangePasswordModal";
import "./ProfileModal.scss";

const ProfileModal = ({ onClose, user, onLogout }) => {
  const { t } = useTranslation(); // Use the hook
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [localUser, setLocalUser] = useState(user);

  const handleResendVerification = async () => {
    try {
      setVerificationMessage("");
      await resendVerificationEmail(localUser.email);
      setVerificationMessage(t("profile.verificationEmailSent"));
    } catch (error) {
      setVerificationMessage(t("profile.verificationEmailFailed"));
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const response = await verifyEmail(localUser.id, localUser.token);
      setLocalUser((prevUser) => ({ ...prevUser, EmailConfirmed: true }));
      alert(t("profile.emailVerified"));
    } catch (error) {
      alert(t("profile.emailVerificationFailed"));
    }
  };

  return (
    <div className="profile-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{t("profile.title")}</h2>
          <button className="close-icon" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">{t("profile.username")}</span>
            <span className="value">{localUser.username || t("profile.notAvailable")}</span>
          </div>
          <div className="detail-item">
            <span className="label">{t("profile.name")}</span>
            <span className="value">{[localUser.firstname, localUser.lastname].join(" ") || t("profile.notAvailable")}</span>
          </div>
          <div className="detail-item">
            <span className="label">{t("profile.email")}</span>
            <span className="value">{localUser.email || t("profile.notAvailable")}</span>
          </div>
          <div className="detail-item">
            <span className="label">{t("profile.verified")}</span>
            <span className="value">
              {localUser.emailConfirmed ? t("profile.yes") : t("profile.no")}
            </span>
          </div>

          {!localUser.emailConfirmed && (
            <div className="verification-section">
              <button className="btn btn-warning" onClick={handleResendVerification}>
                {t("profile.resendVerificationEmail")}
              </button>
              {verificationMessage && <p className="message">{verificationMessage}</p>}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setPasswordModalOpen(true)}>
            {t("profile.changePassword")}
          </button>
          <button className="btn btn-logout" onClick={onLogout}>
            {t("profile.logout")}
          </button>
        </div>
      </div>

      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordModalOpen(false)}
          userId={localUser.Id}
        />
      )}
    </div>
  );
};

export default ProfileModal;