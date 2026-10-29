import React, { useState, useEffect } from 'react';
import { progressApi, memberApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Activity, Plus, TrendingDown, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

// Chart.js imports
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FitnessProgressPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMember = user?.role === 'member';

  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberInfo, setMemberInfo] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    height_cm: '170',
    body_fat_percentage: '',
    chest_cm: '',
    waist_cm: '',
    arms_cm: '',
    notes: ''
  });

  // Check URL query param for memberId
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mId = params.get('memberId');
    if (mId) setSelectedMemberId(mId);
  }, [location.search]);

  // Load members if trainer or admin
  useEffect(() => {
    const init = async () => {
      if (isMember) {
        setSelectedMemberId(user?.member_id);
      } else {
        try {
          const res = await memberApi.getAll({});
          if (res.data.success && res.data.members.length > 0) {
            setMembers(res.data.members);
            if (!selectedMemberId) {
              setSelectedMemberId(res.data.members[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load members for progress tracking:', err);
        }
      }
    };
    init();
  }, [isMember, user]);

  const fetchProgress = async () => {
    if (!selectedMemberId) return;
    try {
      setLoading(true);
      const res = await progressApi.getByMember(selectedMemberId);
      if (res.data.success) {
        setProgressLogs(res.data.progress);
        setMemberInfo(res.data.member);
      }
    } catch (err) {
      console.error('Failed to load progress records:', err);
      setAlert({ type: 'danger', message: 'Could not load progress records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) {
      fetchProgress();
    }
  }, [selectedMemberId]);

  const handleOpenAdd = () => {
    setFormData({
      member_id: selectedMemberId,
      date: new Date().toISOString().split('T')[0],
      weight_kg: '',
      height_cm: '170',
      body_fat_percentage: '',
      chest_cm: '',
      waist_cm: '',
      arms_cm: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await progressApi.create({
        ...formData,
        member_id: selectedMemberId
      });
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Fitness metrics logged successfully!' });
        setIsModalOpen(false);
        fetchProgress();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to record metrics.' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this progress record?')) {
      try {
        const res = await progressApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Progress record deleted.' });
          fetchProgress();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to delete record.' });
      }
    }
  };

  // Line Chart Data
  const chartData = {
    labels: progressLogs.map((p) => p.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: progressLogs.map((p) => parseFloat(p.weight_kg)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Body Fat (%)',
        data: progressLogs.map((p) => (p.body_fat_percentage ? parseFloat(p.body_fat_percentage) : null)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.3,
        pointBackgroundColor: '#059669',
        pointRadius: 5,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Weight (kg)' },
        grid: { color: '#f1f5f9' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Body Fat (%)' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const latest = progressLogs[progressLogs.length - 1];
  const initial = progressLogs[0];
  const weightChange = latest && initial ? (latest.weight_kg - initial.weight_kg).toFixed(1) : null;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Fitness Progress Tracking</h3>
          <p className="text-muted small m-0">Log weight, body composition, BMI calculations, and muscular girth</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
          <Plus size={16} /> Log New Measurement
        </button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Member Selector for Coach/Admin */}
      {!isMember && (
        <div className="filter-bar">
          <div className="d-flex align-items-center gap-3">
            <span className="small text-muted fw-bold">Select Member:</span>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '240px' }}
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Summary KPI Badges */}
      {latest && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card-custom p-3 bg-white text-center">
              <span className="small text-muted fw-bold">CURRENT WEIGHT</span>
              <div className="fs-3 fw-bold text-primary mt-1">{latest.weight_kg} kg</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card-custom p-3 bg-white text-center">
              <span className="small text-muted fw-bold">CURRENT BMI</span>
              <div className="fs-3 fw-bold text-success mt-1">{latest.bmi || 'N/A'}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card-custom p-3 bg-white text-center">
              <span className="small text-muted fw-bold">BODY FAT</span>
              <div className="fs-3 fw-bold text-warning mt-1">
                {latest.body_fat_percentage ? `${latest.body_fat_percentage}%` : '—'}
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card-custom p-3 bg-white text-center">
              <span className="small text-muted fw-bold">NET CHANGE</span>
              <div className="fs-3 fw-bold text-dark mt-1">
                {weightChange ? (
                  parseFloat(weightChange) <= 0 ? (
                    <span className="text-success">{weightChange} kg</span>
                  ) : (
                    <span className="text-primary">+{weightChange} kg</span>
                  )
                ) : '0 kg'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      <div className="card-custom mb-4">
        <div className="card-header-clean">
          <div>
            <h6 className="fw-bold m-0 text-dark">Weight & Composition Timeline</h6>
            <small className="text-muted">Visual trajectory over recorded milestones</small>
          </div>
          <Activity size={20} className="text-primary" />
        </div>
        <div className="card-body-clean" style={{ height: '320px' }}>
          {progressLogs.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              No milestone measurements recorded yet for this member.
            </div>
          )}
        </div>
      </div>

      {/* Log History Table */}
      <div className="card-custom">
        <div className="card-header-clean">
          <h6 className="fw-bold m-0 text-dark">Measurement History Records</h6>
        </div>
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th>Height (cm)</th>
                <th>BMI</th>
                <th>Body Fat (%)</th>
                <th>Chest / Waist / Arms</th>
                <th>Notes</th>
                {!isMember && <th className="text-end">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading progress logs...
                  </td>
                </tr>
              ) : progressLogs.length > 0 ? (
                progressLogs.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold text-dark">{p.date}</td>
                    <td className="fw-bold text-primary">{p.weight_kg} kg</td>
                    <td>{p.height_cm ? `${p.height_cm} cm` : '—'}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{p.bmi || '—'}</span>
                    </td>
                    <td>{p.body_fat_percentage ? `${p.body_fat_percentage}%` : '—'}</td>
                    <td className="small text-muted">
                      {p.chest_cm ? `${p.chest_cm}cm` : '—'} / {p.waist_cm ? `${p.waist_cm}cm` : '—'} / {p.arms_cm ? `${p.arms_cm}cm` : '—'}
                    </td>
                    <td>
                      <small className="text-secondary">{p.notes || '—'}</small>
                    </td>
                    {!isMember && (
                      <td className="text-end">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn btn-sm btn-light border text-danger p-1"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    No measurements recorded. Click "Log New Measurement" to create the baseline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Progress Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Milestone Measurement" size="lg">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Measurement Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                className="form-control form-control-sm"
                required
                placeholder="e.g. 72.5"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Height (cm) (Used for BMI)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                placeholder="e.g. 175"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Body Fat Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="60"
                className="form-control form-control-sm"
                placeholder="e.g. 18.5"
                value={formData.body_fat_percentage}
                onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Chest Circumference (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                value={formData.chest_cm}
                onChange={(e) => setFormData({ ...formData, chest_cm: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Waist Circumference (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                value={formData.waist_cm}
                onChange={(e) => setFormData({ ...formData, waist_cm: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Arms Circumference (cm)</label>
              <input
                type="number"
                step="0.5"
                className="form-control form-control-sm"
                value={formData.arms_cm}
                onChange={(e) => setFormData({ ...formData, arms_cm: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Observations & Coach Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="Diet adherence, energy levels, personal milestones..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FitnessProgressPage;
