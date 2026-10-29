import React, { useState, useEffect } from 'react';
import { workoutPlanApi, memberApi, trainerApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Zap, Plus, Trash2, Edit, Eye, Dumbbell, Calendar, Target, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const WorkoutPlansPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'trainer';
  const isMember = user?.role === 'member';

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    member_id: '',
    trainer_id: '',
    goal: 'Muscle Gain',
    difficulty: 'intermediate',
    schedule_days: 'Mon, Wed, Fri',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10', duration: '60 sec rest', notes: 'Maintain retracted scapula & controlled tempo' },
      { name: 'Incline Dumbbell Flyes', sets: 3, reps: '12', duration: '45 sec rest', notes: 'Deep stretch at bottom' }
    ]
  });

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const res = await workoutPlanApi.getAll({});
      if (res.data.success) {
        setWorkoutPlans(res.data.workoutPlans);
      }
    } catch (err) {
      console.error('Failed to load workout plans:', err);
      setAlert({ type: 'danger', message: 'Failed to fetch workout routines.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    if (canManage) {
      try {
        const [mRes, tRes] = await Promise.all([
          memberApi.getAll({}),
          trainerApi.getAll({})
        ]);
        if (mRes.data.success) setMembers(mRes.data.members);
        if (tRes.data.success) setTrainers(tRes.data.trainers);
      } catch (err) {
        console.error('Dropdown fetch error:', err);
      }
    }
  };

  useEffect(() => {
    fetchWorkoutPlans();
    fetchDropdownData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      member_id: members[0]?.id || '',
      trainer_id: user?.trainer_id || trainers[0]?.id || '',
      goal: 'Muscle Gain',
      difficulty: 'intermediate',
      schedule_days: 'Mon, Wed, Fri',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'active',
      exercises: [
        { name: 'Barbell Squats', sets: 4, reps: '8-10', duration: '90 sec rest', notes: 'Keep chest upright, hit parallel depth' },
        { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', duration: '60 sec rest', notes: 'Hinge at the hips, feel hamstring stretch' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingId(plan.id);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      member_id: plan.member_id,
      trainer_id: plan.trainer_id,
      goal: plan.goal,
      difficulty: plan.difficulty,
      schedule_days: plan.schedule_days,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      status: plan.status || 'active',
      exercises: plan.exercises && plan.exercises.length > 0 ? plan.exercises : [
        { name: 'Exercise 1', sets: 3, reps: '10', duration: '60 sec rest', notes: '' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddExerciseRow = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: 3, reps: '10-12', duration: '60 sec rest', notes: '' }]
    });
  };

  const handleRemoveExerciseRow = (index) => {
    const updated = formData.exercises.filter((_, i) => i !== index);
    setFormData({ ...formData, exercises: updated });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...formData.exercises];
    updated[index][field] = value;
    setFormData({ ...formData, exercises: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await workoutPlanApi.update(editingId, formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Workout routine updated!' });
          setIsModalOpen(false);
          fetchWorkoutPlans();
        }
      } else {
        const res = await workoutPlanApi.create(formData);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Workout routine created and assigned to member!' });
          setIsModalOpen(false);
          fetchWorkoutPlans();
        }
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to save workout plan.' });
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete workout plan "${title}"?`)) {
      try {
        const res = await workoutPlanApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: 'Workout plan deleted.' });
          fetchWorkoutPlans();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to delete plan.' });
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Workout Plan Management</h3>
          <p className="text-muted small m-0">Prescribe customized routines, sets, reps, duration, and trainer form notes</p>
        </div>
        {canManage && (
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Plus size={16} /> Create Workout Plan
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading workout routines...</p>
          </div>
        ) : workoutPlans.length > 0 ? (
          workoutPlans.map((plan) => (
            <div key={plan.id} className="col-12 col-lg-6">
              <div className="card-custom h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold text-dark m-0">{plan.title}</h5>
                      <span className="badge bg-primary-subtle text-primary border text-capitalize mt-1 me-2">
                        {plan.difficulty}
                      </span>
                      <span className="badge bg-secondary-subtle text-secondary border mt-1">
                        🎯 {plan.goal}
                      </span>
                    </div>

                    <div className="btn-group btn-group-sm">
                      <button
                        onClick={() => { setSelectedPlan(plan); setIsViewModalOpen(true); }}
                        className="btn btn-light border text-secondary p-1"
                        title="View Full Routine"
                      >
                        <Eye size={15} />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="btn btn-light border text-primary p-1"
                            title="Edit Plan"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id, plan.title)}
                            className="btn btn-light border text-danger p-1"
                            title="Delete Plan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-secondary small mt-2 mb-3">
                    {plan.description || 'Custom tailored workout routine.'}
                  </p>

                  <div className="p-2 px-3 bg-light rounded-3 mb-3 d-flex flex-wrap justify-content-between small text-muted">
                    <div>👤 Member: <strong className="text-dark">{plan.member_name}</strong></div>
                    <div>🏋 Trainer: <strong className="text-dark">{plan.trainer_name}</strong></div>
                    <div>📅 Days: <span className="text-primary fw-semibold">{plan.schedule_days}</span></div>
                  </div>

                  <h6 className="fw-bold text-dark small text-uppercase mb-2">Prescribed Exercises ({plan.exercises?.length || 0})</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light small">
                        <tr>
                          <th>Exercise Name</th>
                          <th>Sets</th>
                          <th>Reps</th>
                          <th>Duration / Rest</th>
                          <th>Trainer Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.exercises?.slice(0, 3).map((ex, i) => (
                          <tr key={i} className="small">
                            <td className="fw-semibold text-dark">{ex.name}</td>
                            <td>{ex.sets}</td>
                            <td>{ex.reps}</td>
                            <td>{ex.duration || ex.weight_or_time || '—'}</td>
                            <td className="text-muted small">{ex.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                  <span className={`badge-status badge-status-${plan.status} text-capitalize`}>{plan.status}</span>
                  <button
                    onClick={() => { setSelectedPlan(plan); setIsViewModalOpen(true); }}
                    className="btn btn-link text-primary p-0 small fw-bold text-decoration-none"
                  >
                    View All {plan.exercises?.length} Exercises →
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5 text-muted">
            No workout plans assigned yet.
          </div>
        )}
      </div>

      {/* View Full Workout Routine Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={selectedPlan?.title || 'Workout Plan'} size="lg">
        {selectedPlan && (
          <div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge bg-primary text-white text-capitalize px-3 py-1">Difficulty: {selectedPlan.difficulty}</span>
              <span className="badge bg-success text-white px-3 py-1">Goal: {selectedPlan.goal}</span>
              <span className="badge bg-light text-dark border px-3 py-1">Days: {selectedPlan.schedule_days}</span>
              <span className="badge bg-secondary text-white px-3 py-1">Assigned to: {selectedPlan.member_name}</span>
            </div>

            <p className="text-secondary small mb-3">{selectedPlan.description}</p>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light small">
                  <tr>
                    <th>#</th>
                    <th>Exercise Name</th>
                    <th>Sets</th>
                    <th>Repetitions</th>
                    <th>Duration / Rest</th>
                    <th>Trainer Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.exercises?.map((ex, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{idx + 1}</td>
                      <td className="fw-bold text-dark">{ex.name}</td>
                      <td>{ex.sets}</td>
                      <td>{ex.reps}</td>
                      <td>{ex.duration || ex.weight_or_time || '—'}</td>
                      <td className="small text-muted">{ex.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Workout Plan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Workout Routine' : 'Create Workout Routine'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Routine Title *</label>
              <input
                type="text"
                className="form-control form-control-sm"
                required
                placeholder="e.g. Upper Body Hypertrophy & Core"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Assign to Member *</label>
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
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Primary Goal</label>
              <select
                className="form-select form-select-sm"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              >
                <option value="Muscle Gain">Muscle Gain / Hypertrophy</option>
                <option value="Fat Loss">Fat Loss & Cardio</option>
                <option value="Strength">Max Strength & Power</option>
                <option value="Endurance">Athletic Endurance</option>
                <option value="Mobility">Mobility & Rehabilitation</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Difficulty Level</label>
              <select
                className="form-select form-select-sm"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Schedule Days</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Mon, Wed, Fri"
                value={formData.schedule_days}
                onChange={(e) => setFormData({ ...formData, schedule_days: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Description / Program Overview</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="Brief guidelines and workout focus..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="fw-bold m-0 text-dark small text-uppercase">Exercise Program Builder</h6>
            <button type="button" onClick={handleAddExerciseRow} className="btn btn-outline-primary btn-sm py-1">
              + Add Exercise
            </button>
          </div>

          <div className="mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {formData.exercises.map((ex, index) => (
              <div key={index} className="exercise-card mb-2 p-2 border rounded bg-light">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-3">
                    <label className="small text-muted d-block m-0">Exercise Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Barbell Squats"
                      required
                      value={ex.name}
                      onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-4 col-md-2">
                    <label className="small text-muted d-block m-0">Sets</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      placeholder="Sets"
                      required
                      value={ex.sets}
                      onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                    />
                  </div>
                  <div className="col-4 col-md-2">
                    <label className="small text-muted d-block m-0">Repetitions</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Reps (e.g. 10-12)"
                      required
                      value={ex.reps}
                      onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                    />
                  </div>
                  <div className="col-4 col-md-2">
                    <label className="small text-muted d-block m-0">Duration / Rest</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. 60 sec rest"
                      value={ex.duration}
                      onChange={(e) => handleExerciseChange(index, 'duration', e.target.value)}
                    />
                  </div>
                  <div className="col-10 col-md-2">
                    <label className="small text-muted d-block m-0">Trainer Notes</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Form cues / notes"
                      value={ex.notes}
                      onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                    />
                  </div>
                  <div className="col-2 col-md-1 text-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveExerciseRow(index)}
                      className="btn btn-sm btn-outline-danger p-1"
                      disabled={formData.exercises.length === 1}
                      title="Remove Exercise"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer-custom mt-3">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              {editingId ? 'Save Changes' : 'Create & Assign Routine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkoutPlansPage;
