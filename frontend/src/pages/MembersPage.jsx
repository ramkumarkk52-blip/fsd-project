import React, { useState, useEffect } from 'react';
import { memberApi, membershipApi, trainerApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Plus, Filter, Edit, Trash2, Eye, ShieldAlert } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const MembersPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    gender: 'male',
    dob: '',
    emergency_contact: '',
    health_conditions: '',
    membership_id: '',
    trainer_id: '',
    status: 'active'
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getAll({
        search,
        status: selectedStatus || undefined,
        membership_id: selectedPlan || undefined,
        trainer_id: selectedTrainer || undefined
      });
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
      setAlert({ type: 'danger', message: 'Failed to fetch member records.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        membershipApi.getAll({}),
        trainerApi.getAll({})
      ]);
      if (mRes.data.success) setMemberships(mRes.data.memberships);
      if (tRes.data.success) setTrainers(tRes.data.trainers);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedStatus, selectedPlan, selectedTrainer]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      gender: 'male',
      dob: '',
      emergency_contact: '',
      health_conditions: '',
      membership_id: memberships[0]?.id || '',
      trainer_id: '',
      status: 'active'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData({
      name: m.name,
      email: m.email,
      phone: m.phone || '',
      address: m.address || '',
      gender: m.gender || 'male',
      dob: m.dob || '',
      emergency_contact: m.emergency_contact || '',
      health_conditions: m.health_conditions || '',
      membership_id: m.membership_id || '',
      trainer_id: m.trainer_id || '',
      status: m.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (id) => {
    try {
      const res = await memberApi.getById(id);
      if (res.data.success) {
        setMemberDetails(res.data.member);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to retrieve detailed profile.' });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await memberApi.create(formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Member registered successfully!' });
        setIsAddModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to create member.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await memberApi.update(selectedMember.id, formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Member profile updated.' });
        setIsEditModalOpen(false);
        fetchMembers();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update member.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete member "${name}"? This will delete all their records.`)) {
      try {
        const res = await memberApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: `Member ${name} deleted successfully.` });
          fetchMembers();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete member.' });
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Member Directory</h3>
          <p className="text-muted small m-0">View, search, and manage registered athletes & gym memberships</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Plus size={16} /> Add New Member
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-group flex-fill" style={{ maxWidth: '320px' }}>
          <Search size={16} />
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="d-flex flex-wrap gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="">All Plans</option>
            {memberships.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {isAdmin && (
            <select
              className="form-select form-select-sm"
              style={{ width: '160px' }}
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
            >
              <option value="">All Trainers</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <select
            className="form-select form-select-sm"
            style={{ width: '130px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card-custom">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership Plan</th>
                <th>Assigned Trainer</th>
                <th>Subscription Status</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading members...
                  </td>
                </tr>
              ) : members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=3b82f6&color=fff`}
                          alt={m.name}
                          className="user-avatar"
                          style={{ width: '34px', height: '34px' }}
                        />
                        <div>
                          <div className="fw-bold text-dark">{m.name}</div>
                          <small className="text-muted">{m.email} {m.phone && `• ${m.phone}`}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {m.membership_name || 'No Plan'}
                      </span>
                    </td>
                    <td>
                      {m.trainer_name ? (
                        <span className="small fw-semibold text-primary">{m.trainer_name}</span>
                      ) : (
                        <span className="text-muted small">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {m.subscription_end_date ? (
                        <div>
                          <span className={`badge-status badge-status-${m.subscription_status || 'active'}`}>
                            {m.subscription_status || 'active'}
                          </span>
                          <small className="text-muted d-block mt-1">Exp: {m.subscription_end_date}</small>
                        </div>
                      ) : (
                        <span className="text-muted small">No record</span>
                      )}
                    </td>
                    <td>
                      <span className="small text-secondary">{m.join_date}</span>
                    </td>
                    <td>
                      <span className={`badge-status badge-status-${m.status}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          onClick={() => handleOpenView(m.id)}
                          className="btn btn-light border text-secondary"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="btn btn-light border text-primary"
                          title="Edit Member"
                        >
                          <Edit size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="btn btn-light border text-danger"
                            title="Delete Member"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No members found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Gym Member" size="lg">
        <form onSubmit={handleCreateSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Full Name *</label>
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
                placeholder="At least 6 characters"
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
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Gender</label>
              <select
                className="form-select form-select-sm"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Date of Birth</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Emergency Contact</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Membership Plan</label>
              <select
                className="form-select form-select-sm"
                value={formData.membership_id}
                onChange={(e) => setFormData({ ...formData, membership_id: e.target.value })}
              >
                <option value="">-- No Plan / Pending --</option>
                {memberships.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${parseFloat(p.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Assign Trainer</label>
              <select
                className="form-select form-select-sm"
                value={formData.trainer_id}
                onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              >
                <option value="">-- No Trainer Assigned --</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
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
            <div className="col-12">
              <label className="form-label small fw-semibold">Health Conditions / Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="Injuries, medications, or dietary restrictions..."
                value={formData.health_conditions}
                onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Register Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member Profile" size="lg">
        <form onSubmit={handleEditSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Full Name *</label>
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
              <label className="form-label small fw-semibold">Account Status</label>
              <select
                className="form-select form-select-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Membership Plan</label>
              <select
                className="form-select form-select-sm"
                value={formData.membership_id}
                onChange={(e) => setFormData({ ...formData, membership_id: e.target.value })}
              >
                <option value="">-- No Plan / Pending --</option>
                {memberships.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Assign Trainer</label>
              <select
                className="form-select form-select-sm"
                value={formData.trainer_id}
                onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              >
                <option value="">-- No Trainer Assigned --</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Gender</label>
              <select
                className="form-select form-select-sm"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Emergency Contact</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Health Conditions / Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                value={formData.health_conditions}
                onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
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

      {/* View Member Profile Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Member Profile & Records" size="lg">
        {memberDetails ? (
          <div>
            <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4">
              <img
                src={memberDetails.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberDetails.name)}&background=3b82f6&color=fff`}
                alt={memberDetails.name}
                className="user-avatar"
                style={{ width: '56px', height: '56px' }}
              />
              <div className="flex-fill">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold m-0 text-dark">{memberDetails.name}</h5>
                  <span className={`badge-status badge-status-${memberDetails.status}`}>{memberDetails.status}</span>
                </div>
                <div className="small text-muted mt-1">
                  {memberDetails.email} • {memberDetails.phone || 'No phone'} • Joined: {memberDetails.join_date}
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 border rounded bg-white">
                  <span className="small text-muted fw-semibold d-block">CURRENT MEMBERSHIP</span>
                  <div className="fw-bold text-dark fs-6 mt-1">{memberDetails.membership_name || 'No Plan Active'}</div>
                  <div className="small text-secondary mt-1">
                    Trainer: <strong className="text-dark">{memberDetails.trainer_name || 'None'}</strong>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded bg-white">
                  <span className="small text-muted fw-semibold d-block">HEALTH & SAFETY</span>
                  <div className="small text-dark mt-1">
                    Conditions: {memberDetails.health_conditions || 'None reported'}
                  </div>
                  <div className="small text-secondary mt-1">
                    Emergency: {memberDetails.emergency_contact || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscriptions History */}
            <h6 className="fw-bold text-dark small text-uppercase mb-2">Subscription & Renewal History</h6>
            <div className="table-responsive mb-4">
              <table className="table table-sm table-bordered">
                <thead className="table-light small">
                  <tr>
                    <th>Plan</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDetails.subscriptions?.map((s) => (
                    <tr key={s.id} className="small">
                      <td className="fw-semibold">{s.membership_name}</td>
                      <td>{s.start_date}</td>
                      <td>{s.end_date}</td>
                      <td>${parseFloat(s.amount_paid).toFixed(2)}</td>
                      <td><span className={`badge-status badge-status-${s.status}`}>{s.status}</span></td>
                    </tr>
                  ))}
                  {(!memberDetails.subscriptions || memberDetails.subscriptions.length === 0) && (
                    <tr><td colSpan="5" className="text-center py-2 text-muted small">No subscriptions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Progress */}
            <h6 className="fw-bold text-dark small text-uppercase mb-2">Fitness Progress Snapshots</h6>
            <div className="table-responsive mb-4">
              <table className="table table-sm table-bordered">
                <thead className="table-light small">
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>BMI</th>
                    <th>Body Fat %</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDetails.progress?.map((p) => (
                    <tr key={p.id} className="small">
                      <td>{p.date}</td>
                      <td className="fw-bold">{p.weight_kg} kg</td>
                      <td>{p.bmi || '—'}</td>
                      <td>{p.body_fat_percentage ? `${p.body_fat_percentage}%` : '—'}</td>
                      <td>{p.notes || '—'}</td>
                    </tr>
                  ))}
                  {(!memberDetails.progress || memberDetails.progress.length === 0) && (
                    <tr><td colSpan="5" className="text-center py-2 text-muted small">No fitness progress logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Attendance History */}
            <h6 className="fw-bold text-dark small text-uppercase mb-2">Recent Attendance History</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light small">
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDetails.attendance?.map((a) => (
                    <tr key={a.id} className="small">
                      <td>{a.date}</td>
                      <td>{a.check_in_time}</td>
                      <td>{a.check_out_time || '—'}</td>
                      <td><span className={`badge-status badge-status-${a.status}`}>{a.status}</span></td>
                      <td>{a.notes || '—'}</td>
                    </tr>
                  ))}
                  {(!memberDetails.attendance || memberDetails.attendance.length === 0) && (
                    <tr><td colSpan="5" className="text-center py-2 text-muted small">No attendance records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default MembersPage;
