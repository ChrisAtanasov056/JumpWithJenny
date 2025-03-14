import React, { useState } from "react";
import { changePassword } from "../../services/authService";
import "./ChangePasswordModal.scss";

const ChangePasswordModal = ({ onClose, userId }) => {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError("All fields are required.");
      return;
    }
    if (passwords.new.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        id: userId,
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });

      setSuccessMessage("Password changed successfully!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Password change failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <div className="modal-header">
          <h3>Change Password</h3>
          <button
            className="close-icon"
            onClick={onClose}
            disabled={isLoading}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert error">{error}</div>}
          {successMessage && <div className="alert success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Changing..." : "Update Password"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;