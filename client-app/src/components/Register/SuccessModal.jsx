import React, { useRef } from 'react';
import './SuccessModal.scss';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';

const SuccessModal = ({ message, onClose }) => {
  const { t } = useTranslation();
  const modalContentRef = useRef(null);

  useOutsideClick(modalContentRef, onClose, true);
  useModalAccessibility({ isOpen: true, onClose, modalRef: modalContentRef });

  return (
    <div className="success-modal-overlay">
      <div
        className="success-modal-content"
        ref={modalContentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <FaCheckCircle className="success-modal-icon" aria-hidden="true" />
        <h2 id="register-success-title" className="success-modal-title">
          {t('successModal.title')}
        </h2>
        <p className="success-modal-message">{message}</p>
        <button type="button" className="success-modal-close-button" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
