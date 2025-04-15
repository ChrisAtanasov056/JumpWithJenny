import React, { useState, useEffect } from "react";
import { resendVerificationEmail, verifyEmail } from "../../services/authService";
import ChangePasswordModal from "../ChangePassword/ChangePasswordModal"; // Import the new component
import "./ProfileModal.scss";

const ProfileModal = ({ onClose, user, onLogout }) => {
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [localUser, setLocalUser] = useState(user);

  const handleResendVerification = async () => {
    try {
      setVerificationMessage("");
      await resendVerificationEmail(localUser.email);
      setVerificationMessage("Verification email sent! Check your inbox.");
    } catch (error) {
      setVerificationMessage("Failed to send email. Please try again.");
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const response = await verifyEmail(localUser.id, localUser.token);
      setLocalUser((prevUser) => ({ ...prevUser, EmailConfirmed: true }));
      alert("Email verified successfully!");
    } catch (error) {
      alert("Error confirming email. Please try again.");
    }
  };

  return (
    <div className="profile-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Your Profile</h2>
          <button className="close-icon" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Username</span>
            <span className="value">{localUser.username || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Name</span>
            <span className="value">{[localUser.firstname, localUser.lastname].join(" ") || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Email</span>
            <span className="value">{localUser.email || "N/A"}</span>
          </div>
          <div className="detail-item">
            <span className="label">Verified</span>
            <span className="value">
              {localUser.emailConfirmed ? "Yes ✅" : "No ❌"}
            </span>
          </div>

          {!localUser.emailConfirmed && (
            <div className="verification-section">
              <button className="btn btn-warning" onClick={handleResendVerification}>
                Resend Verification Email
              </button>
              {verificationMessage && <p className="message">{verificationMessage}</p>}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setPasswordModalOpen(true)}>
            Change Password
          </button>
          <button className="btn btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Use the new ChangePasswordModal */}
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