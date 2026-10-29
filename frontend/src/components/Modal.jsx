import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div
        className={`modal-dialog-custom ${size === 'lg' ? 'modal-lg' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <h5 className="m-0 fw-bold">{title}</h5>
          <button
            type="button"
            className="btn btn-sm btn-light border-0 p-1 rounded-circle"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body-custom">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
