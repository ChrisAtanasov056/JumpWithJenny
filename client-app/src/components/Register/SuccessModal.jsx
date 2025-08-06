import React from 'react';
import './SuccessModal.scss';
import { FaCheckCircle } from 'react-icons/fa';

const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-content">
        <FaCheckCircle className="success-modal-icon" />
        <h2 className="success-modal-title">Успех!</h2>
        <p className="success-modal-message">{message}</p>
        <button className="success-modal-close-button" onClick={onClose}>Затвори</button>
      </div>
    </div>
  );
};

export default SuccessModal;