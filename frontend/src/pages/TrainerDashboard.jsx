import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/axiosConfig';
import StatCard from '../components/StatCard';
import { Users, Zap, Calendar, Clock, Activity, ArrowRight, PlusCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrainerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrainerDashboard = async () => {
      try {
        const res = await dashboardApi.getTrainer();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load trainer dashboard:', err);
        setError('Failed to load trainer metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading trainer portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="alert alert-danger">{error || 'No trainer data available.'}</div>;
  }

  const { stats, upcomingSessions, members, recentProgress } = data;

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Trainer Command Center</h3>
          <p className="text-muted small m-0">Track assigned athletes, training programs, and session calendar</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/trainer/workout-plans" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <PlusCircle size={16} /> New Workout Plan
          </Link>
          <Link to="/trainer/schedules" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <Calendar size={16} /> Manage Schedule
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <StatCard
            title="Assigned Members"
            value={stats.assignedMembers}
            subtitle="Active trainees under your guidance"
            icon={Users}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Active Workout Plans"
            value={stats.activeWorkoutPlans}
            subtitle="Custom routines created"
            icon={Zap}
            color="success"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Sessions Today"
            value={stats.sessionsToday}
            subtitle="Booked PT & Group classes"
            icon={Calendar}
            color="warning"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Upcoming Training Sessions */}
        <div className="col-12 col-lg-6">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Upcoming Training Sessions</h6>
              <Link to="/trainer/schedules" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                View Calendar <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body-clean">
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <div className="d-flex flex-direction-column flex-column gap-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-bold text-dark">{session.session_title}</div>
                        <div className="small text-muted mt-1">
                          Client: <span className="fw-semibold text-dark">{session.member_name || 'Open Group'}</span> • Room: {session.room}
                        </div>
                        <div className="small text-primary mt-1 d-flex align-items-center gap-2">
                          <span>📅 {session.session_date}</span>
                          <span>⏰ {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                        </div>
                      </div>
                      <span className={`badge-status badge-status-${session.status} text-capitalize`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No upcoming sessions scheduled.</p>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Trainees */}
        <div className="col-12 col-lg-6">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">My Assigned Trainees</h6>
              <Link to="/trainer/members" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                View Trainees <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members?.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="fw-bold text-dark">{m.name}</div>
                        <span className="badge bg-light text-secondary border text-capitalize">{m.gender}</span>
                      </td>
                      <td>
                        <span className="small fw-semibold text-primary">{m.membership_name || 'Standard'}</span>
                      </td>
                      <td>
                        <small className="text-muted">{m.phone || m.email}</small>
                      </td>
                      <td>
                        <Link
                          to={`/trainer/fitness-progress?memberId=${m.id}`}
                          className="btn btn-sm btn-outline-info py-0 px-2 small"
                          title="Record Progress"
                        >
                          Progress
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!members || members.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">No members currently assigned to you.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Trainee Progress Updates */}
        <div className="col-12">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Recent Trainee Progress Records</h6>
              <Link to="/trainer/fitness-progress" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                All Logs <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Weight</th>
                    <th>BMI</th>
                    <th>Body Fat %</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProgress?.map((p) => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td className="fw-bold text-dark">{p.member_name}</td>
                      <td>{p.weight_kg} kg</td>
                      <td>
                        <span className="badge bg-light text-dark border">{p.bmi || 'N/A'}</span>
                      </td>
                      <td>{p.body_fat_percentage ? `${p.body_fat_percentage}%` : '—'}</td>
                      <td>
                        <small className="text-muted">{p.notes || 'Routine check'}</small>
                      </td>
                    </tr>
                  ))}
                  {(!recentProgress || recentProgress.length === 0) && (
                    <tr>
                      <td colSpan="6" className="text-center py-3 text-muted">No recent progress entries recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
