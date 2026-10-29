import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/axiosConfig';
import { User, Mail, Phone, MapPin, Lock, Save, KeyRound } from 'lucide-react';
import Alert from '../components/Alert';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    avatar_url: '',
    bio: '',
    specialization: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [alert, setAlert] = useState(null);
  const [passAlert, setPassAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar_url: user.avatar_url || '',
        bio: user.bio || '',
        specialization: user.specialization || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    try {
      setLoading(true);
      const res = await authApi.updateProfile(formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Profile updated successfully!' });
        updateUser(formData);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassAlert(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassAlert({ type: 'danger', message: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPassAlert({ type: 'danger', message: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      setPassLoading(true);
      const res = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        setPassAlert({ type: 'success', message: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPassAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold m-0 text-dark">User Account & Settings</h3>
        <p className="text-muted small m-0">Manage your personal credentials, contact info, and security credentials</p>
      </div>

      <div className="row g-4">
        {/* Profile Details Form */}
        <div className="col-12 col-lg-7">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Profile Information</h6>
              <span className="badge bg-primary text-white text-capitalize">{user?.role}</span>
            </div>
            <div className="card-body-clean">
              {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

              <form onSubmit={handleProfileSubmit}>
                <div className="text-center mb-4">
                  <img
                    src={formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=0D8ABC&color=fff`}
                    alt={formData.name}
                    className="user-avatar shadow"
                    style={{ width: '80px', height: '80px' }}
                  />
                  <div className="small text-muted mt-2">Account Role: <strong>{user?.role?.toUpperCase()}</strong></div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Email Address (Locked)</label>
                    <input
                      type="email"
                      className="form-control form-control-sm bg-light"
                      disabled
                      value={user?.email || ''}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Avatar Image URL</label>
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Address</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  {user?.role === 'trainer' && (
                    <>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Coaching Specialization</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.specialization}
                          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Professional Bio</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 text-end">
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={loading}>
                    <Save size={15} className="me-1" /> {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-12 col-lg-5">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Change Password</h6>
              <KeyRound size={18} className="text-secondary" />
            </div>
            <div className="card-body-clean">
              {passAlert && <Alert type={passAlert.type} message={passAlert.message} onClose={() => setPassAlert(null)} />}

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Current Password *</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Password * (min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Confirm New Password *</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-outline-primary btn-sm w-100" disabled={passLoading}>
                  <Lock size={15} className="me-1" /> {passLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
