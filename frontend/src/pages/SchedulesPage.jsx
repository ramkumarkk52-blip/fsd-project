import React, { useState, useEffect } from 'react';
import { scheduleApi, trainerApi, memberApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Plus, Filter, Users, MapPin, CheckCircle, BookOpen, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const SchedulesPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'trainer';
  const isMember = user?.role === 'member';

  const [schedules, setSchedules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    trainer_id: '',
    member_id: '',
    session_title: '',
    session_type: 'personal_training',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    capacity: 1,
    room: 'Main Gym Floor',
    status: 'scheduled',
    notes: ''
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await scheduleApi.getAll({
        session_date: dateFilter || undefined,
        session_type: typeFilter || undefined
      });
      if (res.data.success) {
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setAlert({ type: 'danger', message: 'Failed to load training schedule.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        trainerApi.getAll({}),
        canManage ? memberApi.getAll({}) : Promise.resolve({ data: { members: [] } })
      ]);
      if (tRes.data.success) setTrainers(tRes.data.trainers);
      if (mRes.data?.members) setMembers(mRes.data.members);
    } catch (err) {
      console.error('Dropdown error:', err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [dateFilter, typeFilter]);

  const handleOpenAdd = () => {
    setFormData({
      trainer_id: user?.trainer_id || trainers[0]?.id || '',
      member_id: '',
      session_title: '',
      session_type: 'personal_training',
      session_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
      capacity: 1,
      room: 'Main Gym Floor',
      status: 'scheduled',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await scheduleApi.create(formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Session added to schedule!' });
        setIsModalOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to create schedule session.' });
    }
  };

  const handleBook = async (id, title) => {
    try {
      const res = await scheduleApi.book(id);
      if (res.data.success) {
        setAlert({ type: 'success', message: `Successfully registered for "${title}"!` });
        fetchSchedules();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Could not register for this session.' });
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Cancel session "${title}"?`)) {
      try {
        const res = await scheduleApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Session removed.' });
          fetchSchedules();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to cancel session.' });
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Training Schedule & Classes</h3>
          <p className="text-muted small m-0">Book personal training sessions, group workshops, and coaching clinics</p>
        </div>
        {canManage && (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Plus size={16} /> Schedule Session
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="filter-bar">
        <div className="d-flex align-items-center gap-2">
          <label className="small text-muted fw-bold">Date:</label>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: '160px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="btn btn-light btn-sm border">
              Clear
            </button>
          )}
        </div>

        <select
          className="form-select form-select-sm"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Session Types</option>
          <option value="personal_training">Personal Training</option>
          <option value="group_class">Group Class</option>
          <option value="consultation">Consultation</option>
          <option value="open_slot">Open Slot</option>
        </select>
      </div>

      {/* Schedule Grid */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading schedule calendar...</p>
          </div>
        ) : schedules.length > 0 ? (
          schedules.map((s) => (
            <div key={s.id} className="col-12 col-md-6 col-xl-4">
              <div className="card-custom h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary border text-capitalize">
                      {s.session_type.replace('_', ' ')}
                    </span>
                    <span className={`badge-status badge-status-${s.status} text-capitalize`}>
                      {s.status}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark m-0 mt-2">{s.session_title}</h5>

                  <div className="small text-muted mt-2 d-flex flex-column gap-1">
                    <div className="d-flex align-items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <strong>{s.session_date}</strong>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={14} className="text-secondary" />
                      <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={14} className="text-danger" />
                      <span>{s.room}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 my-3">
                    <div className="small text-muted">Trainer: <strong className="text-dark">{s.trainer_name}</strong></div>
                    <div className="small text-muted mt-1">
                      Client / Attendee: <span className="fw-semibold text-primary">{s.member_name || 'Open Registration'}</span>
                    </div>
                    {s.notes && <div className="small text-secondary mt-1 fst-italic">"{s.notes}"</div>}
                  </div>
                </div>

                <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                  {isMember && !s.member_id && s.status === 'scheduled' && (
                    <button
                      onClick={() => handleBook(s.id, s.session_title)}
                      className="btn btn-sm btn-primary w-100 fw-semibold"
                    >
                      Book This Session
                    </button>
                  )}

                  {isMember && s.member_id === user?.member_id && (
                    <span className="badge bg-success-subtle text-success border w-100 py-2">
                      ✓ You are Booked
                    </span>
                  )}

                  {canManage && (
                    <div className="d-flex justify-content-between w-100 align-items-center">
                      <small className="text-muted">Max Capacity: {s.capacity}</small>
                      <button
                        onClick={() => handleDelete(s.id, s.session_title)}
                        className="btn btn-sm btn-light border text-danger"
                        title="Delete Session"
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-muted">
            No training sessions scheduled for the selected criteria.
          </div>
        )}
      </div>

      {/* Add Session Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Training Session" size="lg">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-semibold">Session Title *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                placeholder="e.g. 1-on-1 Hypertrophy Assessment or Morning Yoga Flow"
                value={formData.session_title}
                onChange={(e) => setFormData({ ...formData, session_title: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Trainer *</label>
              <select
                className="form-select form-select-sm"
                required
                value={formData.trainer_id}
                onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              >
                <option value="">-- Select Trainer --</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Assign to Member (Optional)</label>
              <select
                className="form-select form-select-sm"
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              >
                <option value="">-- Open Session / Group Class --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Session Type</label>
              <select
                className="form-select form-select-sm"
                value={formData.session_type}
                onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
              >
                <option value="personal_training">Personal Training</option>
                <option value="group_class">Group Class</option>
                <option value="consultation">Consultation</option>
                <option value="open_slot">Open Slot</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                required
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Start Time *</label>
              <input
                type="time"
                className="form-control form-control-sm"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">End Time *</label>
              <input
                type="time"
                className="form-control form-control-sm"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Location / Room</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Capacity</label>
              <input
                type="number"
                min="1"
                className="form-control form-control-sm"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Notes / Instructions</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Bring towel, water bottle, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SchedulesPage;
