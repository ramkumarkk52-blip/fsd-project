import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge-admin user-role-badge">Administrator</span>;
      case 'trainer':
        return <span className="badge-trainer user-role-badge">Personal Trainer</span>;
      case 'member':
        return <span className="badge-member user-role-badge">Gym Member</span>;
      default:
        return null;
    }
  };

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-light d-lg-none p-2 border"
          onClick={onToggleSidebar}
          title="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h5 className="m-0 fw-bold text-dark">Fitness Center Management System</h5>
          <small className="text-muted d-none d-md-block">Modern Gym Operations & Member Portal</small>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-none d-sm-block text-end">
          <div className="fw-bold small text-dark">{user?.name}</div>
          <div>{getRoleBadge(user?.role)}</div>
        </div>

        <Link to="/profile" title="View Profile">
          <img
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`}
            alt={user?.name}
            className="user-avatar"
            style={{ width: '38px', height: '38px' }}
          />
        </Link>

        <button
          onClick={handleLogout}
          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 px-3 py-1 rounded-3"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="d-none d-md-inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
