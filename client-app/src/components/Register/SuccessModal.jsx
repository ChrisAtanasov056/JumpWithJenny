import React, { useRef } from 'react';
import './SuccessModal.scss';
import { FaCheckCircle } from 'react-icons/fa';
import useOutsideClick from '../../services/useOutsideClick'; 

const SuccessModal = ({ message, onClose }) => {
  const modalContentRef = useRef(null);
  
  useOutsideClick(modalContentRef, onClose);

  return (
    <div className="success-modal-overlay">
      <div 
        className="success-modal-content" 
        ref={modalContentRef} 
        onClick={(e) => e.stopPropagation()}
      >
        <FaCheckCircle className="success-modal-icon" />
        <h2 className="success-modal-title">Успех!</h2>
        <p className="success-modal-message">{message}</p>
        <button className="success-modal-close-button" onClick={onClose}>Затвори</button>
      </div>
    </div>
  );
};

export default SuccessModal;
