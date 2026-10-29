import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Lock, Mail, Eye, EyeOff, Shield, Award, User } from 'lucide-react';
import Alert from '../components/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'trainer') navigate('/trainer/dashboard');
      else navigate('/member/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card-custom p-4 p-md-5 shadow-lg" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 shadow"
            style={{ width: '56px', height: '56px' }}
          >
            <Dumbbell size={28} />
          </div>
          <h3 className="fw-bold text-dark m-0">Fitness Center</h3>
          <p className="text-muted small mt-1">Management System & Member Portal</p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Mail size={18} className="text-muted" />
              </span>
              <input
                type="email"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="name@fitness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-secondary m-0">Password</label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Lock size={18} className="text-muted" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control bg-light border-start-0 border-end-0 ps-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-group-text bg-light border-start-0 text-muted"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Authenticating...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small fw-semibold mb-2 text-center">Quick Demo Login:</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
              onClick={() => handleQuickDemo('admin@fitness.com', 'AdminPassword123!')}
            >
              <Shield size={14} /> Admin
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
              onClick={() => handleQuickDemo('marcus@fitness.com', 'TrainerPassword123!')}
            >
              <Award size={14} /> Trainer
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => handleQuickDemo('member@fitness.com', 'MemberPassword123!')}
            >
              <User size={14} /> Member
            </button>
          </div>
        </div>

        <div className="text-center mt-4 pt-2">
          <span className="text-muted small">Don't have an account yet? </span>
          <Link to="/register" className="small fw-bold text-primary text-decoration-none">
            Register as a Member
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
