import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  return (
    <div className={`stat-card stat-${color}`}>
      <div>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <small className="text-muted mt-1 d-block">{subtitle}</small>}
      </div>
      <div className={`stat-icon-wrapper stat-icon-${color}`}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};

export default StatCard;
