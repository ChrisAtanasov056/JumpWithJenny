import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import useOutsideClick from '../../services/useOutsideClick';
import useModalAccessibility from '../../services/useModalAccessibility';
import './SuccessModal.scss';

const SuccessModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalContentRef = useRef(null);

  useOutsideClick(modalContentRef, onClose, isOpen);
  useModalAccessibility({ isOpen, onClose, modalRef: modalContentRef });

  if (!isOpen) return null;

  return (
    <div className="success-modal__overlay">
      <div
        ref={modalContentRef}
        className="success-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-modal__icon" aria-hidden="true">
          <FaCheckCircle />
        </div>
        <h2 id="contact-success-title" className="success-modal__title">
          {t('contacts.successMessage')}
        </h2>
        <p className="success-modal__text">{t('contacts.successDescription')}</p>
        <button type="button" onClick={onClose} className="success-modal__button">
          {t('contacts.ok')}
          <span className="success-modal__close-icon" aria-hidden="true">
            <FaTimes />
          </span>
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
