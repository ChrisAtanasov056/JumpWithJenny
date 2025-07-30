import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import './SuccessModal.scss'; // Keep this import

const SuccessModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="success-modal__overlay" onClick={onClose}>
      <div className="success-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="success-modal__icon">
          <FaCheckCircle />
        </div>
        <h2 className="success-modal__title">{t('contacts.successMessage')}</h2>
        <p className="success-modal__text">{t('contacts.successDescription')}</p>
        <button onClick={onClose} className="success-modal__button">
          {t('contacts.ok')}
          <span className="success-modal__close-icon"><FaTimes /></span>
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;