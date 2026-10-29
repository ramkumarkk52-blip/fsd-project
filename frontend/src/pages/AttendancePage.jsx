import React, { useState, useEffect } from 'react';
import { attendanceApi, memberApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Calendar, Search, Plus, Clock, LogOut, Trash2, Percent, TrendingUp } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const AttendancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTrainer = user?.role === 'trainer';
  const isMember = user?.role === 'member';

  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Metrics
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState(0);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00',
    check_out_time: '',
    status: 'present',
    notes: ''
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (isMember) {
        const res = await attendanceApi.getMy();
        if (res.data.success) {
          setAttendance(res.data.attendance);
          setAttendancePercentage(res.data.percentage || 0);
          setThisMonthCount(res.data.thisMonth || 0);
        }
      } else {
        const res = await attendanceApi.getAll({
          date: dateFilter || undefined,
          search
        });
        if (res.data.success) {
          setAttendance(res.data.attendance);
          // Calculate stats for gym-wide attendance
          const today = new Date().toISOString().split('T')[0];
          const todayVisits = res.data.attendance.filter(a => a.date === today).length;
          setThisMonthCount(todayVisits);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setAlert({ type: 'danger', message: 'Failed to retrieve attendance logs.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!isMember) {
      try {
        const res = await memberApi.getAll({});
        if (res.data.success) setMembers(res.data.members);
      } catch (err) {
        console.error('Failed to load members for attendance:', err);
      }
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 300);
    return () => clearTimeout(timer);
  }, [dateFilter, search]);

  const handleOpenAdd = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
    setFormData({
      member_id: isMember ? user?.member_id : (members[0]?.id || ''),
      date: now.toISOString().split('T')[0],
      check_in_time: timeStr,
      check_out_time: '',
      status: 'present',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceApi.record(formData);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Attendance recorded successfully!' });
        setIsAddModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to record attendance.' });
    }
  };

  const handleCheckOut = async (id) => {
    try {
      const time = new Date().toTimeString().split(' ')[0].slice(0, 5);
      const res = await attendanceApi.checkOut(id, { check_out_time: time });
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Check-out time recorded.' });
        fetchAttendance();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to record check-out.' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this attendance entry?')) {
      try {
        const res = await attendanceApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Attendance record deleted.' });
          fetchAttendance();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to delete record.' });
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">
            {isMember ? 'My Gym Attendance Log' : 'Attendance & Check-in Management'}
          </h3>
          <p className="text-muted small m-0">Monitor daily gym visits, entry/exit timestamps, and attendance consistency</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
          <Plus size={16} /> {isMember ? 'Check In Now' : 'Record Check-In'}
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Attendance Consistency & Percentage Widget */}
      <div className="row g-3 mb-4">
        {isMember ? (
          <>
            <div className="col-12 col-md-4">
              <div className="card-custom p-3 bg-white">
                <span className="small text-muted fw-bold">TOTAL VISITS</span>
                <div className="fs-3 fw-bold text-primary mt-1">{attendance.length} sessions</div>
                <small className="text-muted">Lifetime gym check-ins</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card-custom p-3 bg-white">
                <span className="small text-muted fw-bold">THIS MONTH</span>
                <div className="fs-3 fw-bold text-success mt-1">{thisMonthCount} visits</div>
                <small className="text-muted">Current billing period</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card-custom p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted fw-bold">ATTENDANCE RATE</span>
                  <span className="badge bg-primary text-white">{attendancePercentage}%</span>
                </div>
                <div className="progress mt-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
                <small className="text-muted mt-1 d-block">Monthly workout consistency</small>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="col-12 col-md-6">
              <div className="card-custom p-3 bg-white">
                <span className="small text-muted fw-bold">TOTAL LOGGED CHECK-INS</span>
                <div className="fs-3 fw-bold text-primary mt-1">{attendance.length} records</div>
                <small className="text-muted">All active gym members</small>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card-custom p-3 bg-white">
                <span className="small text-muted fw-bold">TODAY'S VISITS</span>
                <div className="fs-3 fw-bold text-success mt-1">{thisMonthCount} check-ins</div>
                <small className="text-muted">Members checked in today</small>
              </div>
            </div>
          </>
        )}
      </div>

      {!isMember && (
        <div className="filter-bar">
          <div className="search-input-group flex-fill" style={{ maxWidth: '320px' }}>
            <Search size={16} />
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search member name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
        </div>
      )}

      {/* Attendance Table */}
      <div className="card-custom">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                {!isMember && <th>Member</th>}
                <th>Date</th>
                <th>Check In Time</th>
                <th>Check Out Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={!isMember ? 7 : 6} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendance.length > 0 ? (
                attendance.map((a) => (
                  <tr key={a.id}>
                    {!isMember && (
                      <td>
                        <div className="fw-bold text-dark">{a.member_name}</div>
                        <small className="text-muted">{a.membership_name || 'Active Member'}</small>
                      </td>
                    )}
                    <td className="fw-semibold text-dark">{a.date}</td>
                    <td>
                      <span className="text-primary small d-flex align-items-center gap-1">
                        <Clock size={13} /> {a.check_in_time}
                      </span>
                    </td>
                    <td>
                      {a.check_out_time ? (
                        <span className="text-secondary small d-flex align-items-center gap-1">
                          <LogOut size={13} /> {a.check_out_time}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckOut(a.id)}
                          className="btn btn-sm btn-outline-warning py-0 px-2 small"
                          title="Record Check-out Now"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                    <td>
                      <span className={`badge-status badge-status-${a.status}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">{a.notes || '—'}</small>
                    </td>
                    <td className="text-end">
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="btn btn-sm btn-light border text-danger p-1"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={!isMember ? 7 : 6} className="text-center py-4 text-muted">
                    No attendance records found. Click "{isMember ? 'Check In Now' : 'Record Check-In'}" to log attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Attendance Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Attendance Check-In">
        <form onSubmit={handleSubmit}>
          {!isMember && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">Select Member *</label>
              <select
                className="form-select form-select-sm"
                required
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              >
                <option value="">-- Choose Member --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Check-in Time *</label>
              <input
                type="time"
                className="form-control form-control-sm"
                required
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Check-out Time (Optional)</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Status</label>
              <select
                className="form-select form-select-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Notes</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Completed Leg day workout"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Confirm Check-In
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendancePage;
