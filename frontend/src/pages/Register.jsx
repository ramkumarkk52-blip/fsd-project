import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { membershipApi, trainerApi } from '../api/axiosConfig';
import { Dumbbell, User, Mail, Lock, Phone, MapPin, Award } from 'lucide-react';
import Alert from '../components/Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    gender: 'male',
    dob: '',
    emergency_contact: '',
    membership_id: '',
    trainer_id: ''
  });

  const [memberships, setMemberships] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, trainRes] = await Promise.all([
          membershipApi.getAll({ status: 'active' }),
          trainerApi.getAll({})
        ]);
        if (memRes.data.success) setMemberships(memRes.data.memberships);
        if (trainRes.data.success) setTrainers(trainRes.data.trainers);
      } catch (err) {
        console.error('Failed to load signup options:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in required fields (Name, Email, Password).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      navigate('/member/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card-custom p-4 p-md-5 shadow-lg" style={{ maxWidth: '640px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 shadow"
            style={{ width: '56px', height: '56px' }}
          >
            <Dumbbell size={28} />
          </div>
          <h3 className="fw-bold text-dark m-0">Join Our Fitness Center</h3>
          <p className="text-muted small mt-1">Start your fitness transformation journey today</p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Full Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <User size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  name="name"
                  className="form-control bg-light border-start-0"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Email Address *</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Mail size={18} className="text-muted" />
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control bg-light border-start-0"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Password * (min 6 chars)</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Lock size={18} className="text-muted" />
                </span>
                <input
                  type="password"
                  name="password"
                  className="form-control bg-light border-start-0"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Phone size={18} className="text-muted" />
                </span>
                <input
                  type="tel"
                  name="phone"
                  className="form-control bg-light border-start-0"
                  placeholder="+1-555-0199"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Gender</label>
              <select name="gender" className="form-select bg-light" value={formData.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="form-control bg-light"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Emergency Contact</label>
              <input
                type="text"
                name="emergency_contact"
                className="form-control bg-light"
                placeholder="Name / Phone"
                value={formData.emergency_contact}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold text-secondary">Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <MapPin size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  name="address"
                  className="form-control bg-light border-start-0"
                  placeholder="123 Gym Ave, City"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Select Membership Plan</label>
              <select
                name="membership_id"
                className="form-select bg-light"
                value={formData.membership_id}
                onChange={handleChange}
              >
                <option value="">-- Choose a Plan (Optional) --</option>
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${parseFloat(m.price).toFixed(2)} / {m.duration_months} mo)
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Assign Personal Trainer</label>
              <select
                name="trainer_id"
                className="form-select bg-light"
                value={formData.trainer_id}
                onChange={handleChange}
              >
                <option value="">-- Choose a Trainer (Optional) --</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4 pt-2 border-top">
          <span className="text-muted small">Already registered? </span>
          <Link to="/login" className="small fw-bold text-primary text-decoration-none">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
