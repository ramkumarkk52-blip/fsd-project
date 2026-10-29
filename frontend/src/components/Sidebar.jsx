import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  CalendarDays,
  CheckSquare,
  Activity,
  Award,
  UserCheck,
  User,
  Zap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const adminNav = [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { section: 'MANAGEMENT' },
    { title: 'Members', path: '/admin/members', icon: Users },
    { title: 'Trainers', path: '/admin/trainers', icon: Award },
    { title: 'Membership Plans', path: '/admin/memberships', icon: Dumbbell },
    { title: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
    { section: 'TRAINING & FITNESS' },
    { title: 'Workout Plans', path: '/admin/workout-plans', icon: Zap },
    { title: 'Schedules & Classes', path: '/admin/schedules', icon: CalendarDays },
    { title: 'Attendance', path: '/admin/attendance', icon: CheckSquare },
    { title: 'Fitness Progress', path: '/admin/fitness-progress', icon: Activity },
  ];

  const trainerNav = [
    { title: 'Dashboard', path: '/trainer/dashboard', icon: LayoutDashboard },
    { section: 'CLIENTS & WORKOUTS' },
    { title: 'Assigned Members', path: '/trainer/members', icon: UserCheck },
    { title: 'Workout Plans', path: '/trainer/workout-plans', icon: Zap },
    { title: 'Schedule & Sessions', path: '/trainer/schedules', icon: CalendarDays },
    { title: 'Member Attendance', path: '/trainer/attendance', icon: CheckSquare },
    { title: 'Fitness Progress', path: '/trainer/fitness-progress', icon: Activity },
  ];

  const memberNav = [
    { title: 'My Dashboard', path: '/member/dashboard', icon: LayoutDashboard },
    { section: 'MY FITNESS' },
    { title: 'My Workout Plan', path: '/member/workout-plans', icon: Zap },
    { title: 'Classes & Sessions', path: '/member/schedules', icon: CalendarDays },
    { title: 'My Attendance', path: '/member/attendance', icon: CheckSquare },
    { title: 'Fitness Tracking', path: '/member/fitness-progress', icon: Activity },
    { section: 'MEMBERSHIP' },
    { title: 'My Subscriptions', path: '/member/subscriptions', icon: CreditCard },
    { title: 'Explore Plans', path: '/memberships', icon: Dumbbell },
  ];

  let navItems = [];
  if (role === 'admin') navItems = adminNav;
  else if (role === 'trainer') navItems = trainerNav;
  else navItems = memberNav;

  return (
    <>
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 99 }}
          onClick={onClose}
        ></div>
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-icon">
            <Dumbbell size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h4>FITNESS PRO</h4>
            <span>Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={index} className="nav-section-title">
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => onClose && onClose()}
              >
                <Icon size={18} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}

          <div className="nav-section-title">ACCOUNT</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => onClose && onClose()}
          >
            <User size={18} />
            <span>My Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="user-pill text-decoration-none" title="Profile Details">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`}
              alt={user?.name}
              className="user-avatar"
            />
            <div className="user-info-text">
              <div className="user-name">{user?.name}</div>
              <small className="text-secondary text-capitalize">{user?.role}</small>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
