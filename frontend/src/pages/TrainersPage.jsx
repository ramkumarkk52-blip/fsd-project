import React, { useState, useEffect } from 'react';
import { trainerApi, memberApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Award, Plus, Search, Edit, Trash2, Users, DollarSign, Calendar, UserPlus, Clock, Check } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const TrainersPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerDetails, setTrainerDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    specialization: '',
    experience_years: 1,
    bio: '',
    hourly_rate: 50.0,
    hire_date: ''
  });

  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await trainerApi.getAll({ search });
      if (res.data.success) {
        setTrainers(res.data.trainers);
      }
    } catch (err) {
      console.error('Failed to load trainers:', err);
      setAlert({ type: 'danger', message: 'Failed to fetch trainer list.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (isAdmin) {
      try {
        const res = await memberApi.getAll({});
        if (res.data.success) setMembers(res.data.members);
      } catch (err) {
        console.error('Failed to load members for trainer assignment:', err);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrainers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      specialization: '',
      experience_years: 2,
      bio: '',
      hourly_rate: 60.0,
      hire_date: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setSelectedTrainer(t);
    setFormData({
      name: t.name,
      email: t.email,
      phone: t.phone || '',
      address: t.address || '',
      specialization: t.specialization,
      experience_years: t.experience_years,
      bio: t.bio || '',
      hourly_rate: t.hourly_rate || 0,
      status: t.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAssign = async (t) => {
    setSelectedTrainer(t);
    try {
      const res = await trainerApi.getById(t.id);
      if (res.data.success) {
        const currentlyAssignedIds = res.data.trainer.assignedMembers?.map((m) => m.id) || [];
        setSelectedMemberIds(currentlyAssignedIds);
        setIsAssignModalOpen(true);
      }
    } catch (err) {
      setSelectedMemberIds([]);
      setIsAssignModalOpen(true);
    }
  };

  const handleOpenSchedule = async (t) => {
    try {
      const res = await trainerApi.getById(t.id);
      if (res.data.success) {
        setTrainerDetails(res.data.trainer);
        setIsScheduleModalOpen(true);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Could not load trainer schedule.' });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await trainerApi.create(formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Trainer added successfully!' });
        setIsAddModalOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to add trainer.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await trainerApi.update(selectedTrainer.id, formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Trainer profile updated.' });
        setIsEditModalOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update trainer.' });
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await trainerApi.assign(selectedTrainer.id, selectedMemberIds);
      if (res.data.success) {
        setAlert({ type: 'success', message: res.data.message || 'Members successfully assigned to trainer!' });
        setIsAssignModalOpen(false);
        fetchTrainers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to assign members.' });
    }
  };

  const toggleMemberSelection = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove trainer "${name}"?`)) {
      try {
        const res = await trainerApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: `Trainer ${name} removed.` });
          fetchTrainers();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to remove trainer.' });
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Personal Trainers</h3>
          <p className="text-muted small m-0">Certified coaching team, expertise, member assignments, and schedules</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Plus size={16} /> Add Trainer
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="filter-bar">
        <div className="search-input-group flex-fill" style={{ maxWidth: '360px' }}>
          <Search size={16} />
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, email, or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Trainer Cards Grid */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading trainer directory...</p>
          </div>
        ) : trainers.length > 0 ? (
          trainers.map((t) => (
            <div key={t.id} className="col-12 col-md-6 col-xl-4">
              <div className="card-custom h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=10b981&color=fff`}
                        alt={t.name}
                        className="user-avatar"
                        style={{ width: '52px', height: '52px' }}
                      />
                      <div>
                        <h5 className="fw-bold text-dark m-0">{t.name}</h5>
                        <span className="badge bg-success-subtle text-success border mt-1">
                          {t.specialization}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="btn btn-sm btn-light border text-primary p-1"
                          title="Edit Trainer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="btn btn-sm btn-light border text-danger p-1"
                          title="Remove Trainer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-secondary small mb-3" style={{ minHeight: '40px' }}>
                    {t.bio || 'Experienced fitness instructor committed to helping members achieve their personal strength and conditioning goals.'}
                  </p>

                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="row text-center g-2">
                      <div className="col-4 border-end">
                        <div className="small text-muted fw-semibold">EXP</div>
                        <div className="fw-bold text-dark fs-6">{t.experience_years} yrs</div>
                      </div>
                      <div className="col-4 border-end">
                        <div className="small text-muted fw-semibold">CLIENTS</div>
                        <div className="fw-bold text-primary fs-6">{t.assigned_members_count}</div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted fw-semibold">RATE</div>
                        <div className="fw-bold text-success fs-6">${parseFloat(t.hourly_rate).toFixed(0)}/hr</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="pt-2 border-top d-flex justify-content-between align-items-center small text-muted mb-3">
                    <span>✉ {t.email}</span>
                    <span>📞 {t.phone || 'N/A'}</span>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      onClick={() => handleOpenSchedule(t)}
                      className="btn btn-sm btn-outline-primary flex-fill d-flex align-items-center justify-content-center gap-1"
                    >
                      <Calendar size={14} /> Schedule
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenAssign(t)}
                        className="btn btn-sm btn-outline-success flex-fill d-flex align-items-center justify-content-center gap-1"
                      >
                        <UserPlus size={14} /> Assign Members
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-muted">
            No personal trainers found.
          </div>
        )}
      </div>

      {/* Add Trainer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Personal Trainer" size="lg">
        <form onSubmit={handleCreateSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Trainer Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Email Address *</label>
              <input
                type="email"
                className="form-control form-control-sm"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Password *</label>
              <input
                type="password"
                className="form-control form-control-sm"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              <label className="form-label small fw-semibold">Primary Specialization *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                placeholder="e.g. Strength & Bodybuilding, Yoga, CrossFit"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Experience (Years)</label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Professional Biography</label>
              <textarea
                className="form-control form-control-sm"
                rows="3"
                placeholder="Certifications, coaching philosophy, accomplishments..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Create Trainer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Trainer Profile" size="lg">
        <form onSubmit={handleEditSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Trainer Name *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Email Address *</label>
              <input
                type="email"
                className="form-control form-control-sm"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <label className="form-label small fw-semibold">Specialization *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Experience (Years)</label>
              <input
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Professional Biography</label>
              <textarea
                className="form-control form-control-sm"
                rows="3"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Trainer to Members Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign Members to ${selectedTrainer?.name}`} size="md">
        <form onSubmit={handleAssignSubmit}>
          <p className="small text-muted mb-3">
            Select the gym members you want to assign to <strong>{selectedTrainer?.name}</strong>:
          </p>

          <div className="p-2 border rounded bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {members.map((m) => {
              const isChecked = selectedMemberIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`p-2 rounded mb-1 d-flex align-items-center justify-content-between cursor-pointer border ${isChecked ? 'bg-primary-subtle border-primary' : 'bg-white'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleMemberSelection(m.id)}
                >
                  <div>
                    <div className="fw-bold small text-dark">{m.name}</div>
                    <small className="text-muted">{m.email} • {m.membership_name || 'No Plan'}</small>
                  </div>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isChecked}
                    onChange={() => toggleMemberSelection(m.id)}
                  />
                </div>
              );
            })}
          </div>

          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success btn-sm px-3">
              Save Assignments ({selectedMemberIds.length})
            </button>
          </div>
        </form>
      </Modal>

      {/* View Trainer Schedule Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title={`${trainerDetails?.name}'s Schedule & Sessions`} size="lg">
        {trainerDetails && (
          <div>
            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3 border">
              <Award size={24} className="text-primary" />
              <div>
                <h6 className="fw-bold text-dark m-0">{trainerDetails.name} — {trainerDetails.specialization}</h6>
                <small className="text-muted">Rate: ${parseFloat(trainerDetails.hourly_rate).toFixed(2)}/hr • Experience: {trainerDetails.experience_years} years</small>
              </div>
            </div>

            <h6 className="fw-bold text-dark small text-uppercase mb-2">Upcoming Sessions & Bookings</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead className="table-light small">
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Session Title</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trainerDetails.schedules?.map((s) => (
                    <tr key={s.id} className="small">
                      <td className="fw-semibold">{s.session_date}</td>
                      <td>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</td>
                      <td className="fw-bold text-dark">{s.session_title}</td>
                      <td className="text-capitalize">{s.session_type.replace('_', ' ')}</td>
                      <td>{s.member_name || 'Open Group'}</td>
                      <td><span className={`badge-status badge-status-${s.status}`}>{s.status}</span></td>
                    </tr>
                  ))}
                  {(!trainerDetails.schedules || trainerDetails.schedules.length === 0) && (
                    <tr>
                      <td colSpan="6" className="text-center py-3 text-muted small">
                        No sessions scheduled yet for this trainer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrainersPage;
