import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="text-success me-2 flex-shrink-0" />,
    danger: <AlertCircle size={18} className="text-danger me-2 flex-shrink-0" />,
    warning: <AlertCircle size={18} className="text-warning me-2 flex-shrink-0" />,
    info: <Info size={18} className="text-info me-2 flex-shrink-0" />
  };

  return (
    <div className={`alert alert-${type} d-flex align-items-center justify-content-between py-2 px-3 mb-4 rounded-3 shadow-sm`}>
      <div className="d-flex align-items-center">
        {icons[type]}
        <span className="small fw-semibold">{message}</span>
      </div>
      {onClose && (
        <button type="button" className="btn-close btn-close-sm ms-2" onClick={onClose}></button>
      )}
    </div>
  );
};

export default Alert;
