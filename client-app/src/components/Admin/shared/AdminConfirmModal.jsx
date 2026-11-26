import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useModalAccessibility from '../../../services/useModalAccessibility';
import useOutsideClick from '../../../services/useOutsideClick';
import './AdminConfirmModal.scss';

const AdminConfirmModal = ({
  isOpen,
  title,
  message,
  warning,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  useOutsideClick(modalRef, onCancel, isOpen && !isSubmitting);
  useModalAccessibility({
    isOpen,
    onClose: isSubmitting ? undefined : onCancel,
    modalRef,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="adm-modal-overlay" role="presentation">
      <div
        ref={modalRef}
        className="adm-modal-dialog adm-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-header">
          <h3 id="adm-confirm-title">{title}</h3>
          <button
            type="button"
            className="adm-modal-close"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label={t('admin.common.close')}
          >
            &times;
          </button>
        </div>

        <p className="adm-confirm-message">{message}</p>
        {warning && <p className="adm-confirm-warning">{warning}</p>}

        <div className="adm-confirm-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel || t('admin.common.cancel')}
          </button>
          <button
            type="button"
            className={`adm-btn ${variant === 'danger' ? 'adm-btn--danger' : 'adm-btn--primary'}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('admin.common.saving') : (confirmLabel || t('admin.common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmModal;
