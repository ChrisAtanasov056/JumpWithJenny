import React, { useState } from "react";
import { changePassword } from "../../services/authService";
import "./ChangePasswordModal.scss";
import { useTranslation } from "react-i18next"; 

const ChangePasswordModal = ({ onClose, userId }) => {
  const { t } = useTranslation();
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError(t('change_password.errors.all_required'));
      return;
    }
    if (passwords.new.length < 6) {
      setError(t('change_password.errors.min_length'));
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
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || t('change_password.errors.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <div className="modal-header">
          <h3>{t('change_password.title')}</h3>
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
              <label>{t('change_password.current')}</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('change_password.new')}</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('change_password.confirm')}</label>
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
                {isLoading ? t('change_password.changing') : t('change_password.update_btn')}
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
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
