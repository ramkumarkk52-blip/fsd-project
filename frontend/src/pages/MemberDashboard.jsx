import React, { useState, useEffect } from 'react';
import { dashboardApi, attendanceApi } from '../api/axiosConfig';
import StatCard from '../components/StatCard';
import { Dumbbell, Award, Calendar, CheckSquare, Activity, Clock, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';

const MemberDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInMsg, setCheckInMsg] = useState('');

  const fetchMemberDashboard = async () => {
    try {
      const res = await dashboardApi.getMember();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load member dashboard:', err);
      setError('Failed to load your member profile and activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberDashboard();
  }, []);

  const handleQuickCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0];
      const res = await attendanceApi.record({
        date: today,
        check_in_time: time,
        notes: 'Member self check-in via dashboard'
      });
      if (res.data.success) {
        setCheckInMsg('Successfully checked in today! Have a great workout!');
        fetchMemberDashboard();
      }
    } catch (err) {
      setCheckInMsg(err.response?.data?.message || 'Check-in failed or already checked in today.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading your fitness dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="alert alert-danger">{error || 'Unable to load member dashboard.'}</div>;
  }

  const { memberInfo, activeSubscription, activeWorkoutPlan, attendanceStats, fitnessStats, upcomingSessions } = data;

  const daysLeft = activeSubscription ? activeSubscription.days_left : 0;
  const isExpiringSoon = daysLeft <= 14 && daysLeft >= 0;
  const isExpired = daysLeft < 0;

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div className="card-custom bg-white p-4 mb-4 shadow-sm border-0 border-start border-primary border-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h3 className="fw-bold m-0 text-dark">Welcome back, Athlete!</h3>
            <p className="text-muted small m-0 mt-1">Here is your current fitness progress, workout plan, and membership status.</p>
          </div>
          <div className="d-flex gap-2">
            <button onClick={handleQuickCheckIn} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
              <CheckSquare size={16} /> Quick Check-In Today
            </button>
            <Link to="/member/workout-plans" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <Flame size={16} /> View Workout Plan
            </Link>
          </div>
        </div>
      </div>

      {checkInMsg && <Alert type="info" message={checkInMsg} onClose={() => setCheckInMsg('')} />}

      {/* Subscription Expiry Alert */}
      {isExpiringSoon && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-sm">
          <div>
            <strong>Notice:</strong> Your subscription expires in {daysLeft} days ({activeSubscription?.end_date}).
          </div>
          <Link to="/member/subscriptions" className="btn btn-sm btn-warning text-dark fw-bold">
            Renew Subscription
          </Link>
        </div>
      )}

      {isExpired && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-sm">
          <div>
            <strong>Expired:</strong> Your membership has expired. Please renew to continue accessing the gym and classes.
          </div>
          <Link to="/member/subscriptions" className="btn btn-sm btn-danger fw-bold">
            Renew Now
          </Link>
        </div>
      )}

      {/* Quick Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Membership Plan"
            value={memberInfo.membership_name || 'No Active Plan'}
            subtitle={activeSubscription ? `Expires: ${activeSubscription.end_date}` : 'Contact desk'}
            icon={Dumbbell}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Assigned Trainer"
            value={memberInfo.trainer_name || 'Unassigned'}
            subtitle={memberInfo.trainer_specialization || 'Personal Trainer'}
            icon={Award}
            color="info"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Current Weight"
            value={fitnessStats.latest ? `${fitnessStats.latest.weight_kg} kg` : 'Not recorded'}
            subtitle={fitnessStats.latest?.bmi ? `BMI: ${fitnessStats.latest.bmi}` : 'Log first entry'}
            icon={Activity}
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Gym Visits This Month"
            value={`${attendanceStats.thisMonth} sessions`}
            subtitle={`Total lifetime: ${attendanceStats.total}`}
            icon={CheckSquare}
            color="warning"
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Active Workout Routine */}
        <div className="col-12 col-lg-7">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <div>
                <h6 className="fw-bold m-0 text-dark">Active Workout Plan</h6>
                <small className="text-muted">Prescribed by {memberInfo.trainer_name || 'Fitness Coach'}</small>
              </div>
              <Link to="/member/workout-plans" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                Full Routine <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body-clean">
              {activeWorkoutPlan ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="fw-bold text-dark m-0">{activeWorkoutPlan.title}</h5>
                    <span className="badge bg-primary-subtle text-primary border text-capitalize px-3 py-1">
                      {activeWorkoutPlan.difficulty} • {activeWorkoutPlan.goal}
                    </span>
                  </div>
                  <p className="text-secondary small">{activeWorkoutPlan.description}</p>
                  <div className="mb-3 p-2 bg-light rounded text-muted small fw-semibold">
                    📅 Schedule Days: <span className="text-dark">{activeWorkoutPlan.schedule_days}</span>
                  </div>

                  <h6 className="fw-bold text-dark small text-uppercase mb-2">Key Exercises</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr className="small">
                          <th>Exercise</th>
                          <th>Sets</th>
                          <th>Reps</th>
                          <th>Weight / Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeWorkoutPlan.exercises?.slice(0, 4).map((ex, idx) => (
                          <tr key={idx} className="small">
                            <td className="fw-bold text-dark">{ex.name}</td>
                            <td>{ex.sets}</td>
                            <td>{ex.reps}</td>
                            <td>{ex.weight_or_time || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Dumbbell size={40} className="text-muted mb-2" />
                  <p className="text-muted">No active workout plan assigned yet.</p>
                  <small className="text-secondary">Your personal trainer will design a custom plan for you soon.</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Membership & Trainer Info Box */}
        <div className="col-12 col-lg-5">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Membership & Trainer</h6>
              <ShieldCheck size={20} className="text-success" />
            </div>
            <div className="card-body-clean d-flex flex-column justify-content-between">
              <div>
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted small fw-semibold">MEMBERSHIP STATUS</span>
                    <span className="badge-status badge-status-active">Active</span>
                  </div>
                  <h5 className="fw-bold text-dark m-0">{memberInfo.membership_name || 'Standard Tier'}</h5>
                  <div className="small text-muted mt-1">
                    Valid until: <strong className="text-dark">{activeSubscription?.end_date || 'N/A'}</strong>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border">
                  <span className="text-muted small fw-semibold d-block mb-2">ASSIGNED TRAINER</span>
                  {memberInfo.trainer_name ? (
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <Award size={22} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{memberInfo.trainer_name}</div>
                        <div className="small text-muted">{memberInfo.trainer_specialization}</div>
                        <div className="small text-primary">{memberInfo.trainer_email}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted small m-0">No dedicated trainer assigned. You can request one via administrative desk.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <Link to="/member/subscriptions" className="btn btn-outline-primary btn-sm flex-fill">
                  Subscription History
                </Link>
                <Link to="/profile" className="btn btn-light btn-sm border flex-fill">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance & Progress Snapshot */}
      <div className="row g-4">
        {/* Recent Attendance */}
        <div className="col-12 col-lg-6">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Recent Gym Visits</h6>
              <Link to="/member/attendance" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                Full History <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceStats.recent?.map((a) => (
                    <tr key={a.id}>
                      <td className="fw-semibold text-dark">{a.date}</td>
                      <td>{a.check_in_time}</td>
                      <td>{a.check_out_time || '—'}</td>
                      <td>
                        <span className={`badge-status badge-status-${a.status}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!attendanceStats.recent || attendanceStats.recent.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">No attendance logs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Classes / Training Slots */}
        <div className="col-12 col-lg-6">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Upcoming Classes & Sessions</h6>
              <Link to="/member/schedules" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                Browse Classes <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body-clean">
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {upcomingSessions.map((s) => (
                    <div key={s.id} className="p-3 border rounded bg-light d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-bold text-dark">{s.session_title}</div>
                        <div className="small text-muted">
                          Coach: {s.trainer_name} • Room: {s.room}
                        </div>
                        <div className="small text-primary mt-1">
                          📅 {s.session_date} | ⏰ {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                        </div>
                      </div>
                      <span className="badge bg-primary text-white text-capitalize">
                        {s.session_type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-3">No upcoming classes booked.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
