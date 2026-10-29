import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/axiosConfig';
import StatCard from '../components/StatCard';
import { Users, Award, Dumbbell, DollarSign, CalendarCheck, Clock, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getAdmin();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading administrative analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="alert alert-danger">{error || 'No dashboard data available.'}</div>;
  }

  const { stats, charts, recentMembers, recentAttendance } = data;

  // Prepare Revenue Trend Chart Data
  const revenueChartData = {
    labels: charts?.revenueTrend?.map((r) => r.month_label) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: charts?.revenueTrend?.map((r) => parseFloat(r.revenue)) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  // Prepare Membership Distribution Chart Data
  const distributionChartData = {
    labels: charts?.membershipDistribution?.map((d) => d.plan_name) || [],
    datasets: [
      {
        data: charts?.membershipDistribution?.map((d) => d.member_count) || [],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Admin Overview</h3>
          <p className="text-muted small m-0">Performance indicators, revenue trends, and operational summary</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/members" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Users size={16} /> Manage Members
          </Link>
          <Link to="/admin/subscriptions" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <DollarSign size={16} /> Subscriptions & Renewals
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid - Explicitly addressing prompt requirements */}
      <div className="row g-3 mb-4">
        {/* 1. Total Members */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            subtitle={`${stats.activeMembers} active accounts`}
            icon={Users}
            color="primary"
          />
        </div>

        {/* 2. Total Trainers */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Total Trainers"
            value={stats.totalTrainers}
            subtitle="Certified coaches"
            icon={Award}
            color="info"
          />
        </div>

        {/* 3. Today's Attendance */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Today's Attendance"
            value={stats.todayAttendance}
            subtitle="Daily member visits"
            icon={CalendarCheck}
            color="warning"
          />
        </div>

        {/* 4. Active Memberships */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Active Memberships"
            value={stats.activeMemberships || stats.activeSubscriptions}
            subtitle="Valid active plans"
            icon={ShieldCheck}
            color="success"
          />
        </div>

        {/* 5. Expired Memberships */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Expired Memberships"
            value={stats.expiredMemberships || 0}
            subtitle="Require renewal"
            icon={XCircle}
            color="danger"
          />
        </div>

        {/* 6. Monthly Revenue & Total Revenue */}
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            title="Monthly Revenue"
            value={`$${(stats.monthlyRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`Lifetime: $${(stats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="success"
          />
        </div>
      </div>

      {/* Expiry Warning Callout if any */}
      {stats.expiringSoon > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={20} className="text-warning" />
            <div>
              <strong>Subscription Renewal Notice:</strong> {stats.expiringSoon} member membership(s) are expiring in the next 30 days.
            </div>
          </div>
          <Link to="/admin/subscriptions" className="btn btn-sm btn-warning text-dark fw-bold">
            Review Expirations
          </Link>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <div>
                <h6 className="fw-bold m-0 text-dark">Monthly Revenue Trend (Last 6 Months)</h6>
                <small className="text-muted">Subscription fees and renewals by month</small>
              </div>
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div className="card-body-clean" style={{ height: '300px' }}>
              <Bar
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (val) => `$${val}` },
                      grid: { color: '#f1f5f9' },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card-custom h-100">
            <div className="card-header-clean">
              <div>
                <h6 className="fw-bold m-0 text-dark">Membership Distribution</h6>
                <small className="text-muted">Active enrollments per plan</small>
              </div>
              <Dumbbell size={20} className="text-success" />
            </div>
            <div className="card-body-clean d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div style={{ maxWidth: '260px', width: '100%' }}>
                <Doughnut
                  data={distributionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview Tables */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Recent Member Registrations</h6>
              <Link to="/admin/members" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Join Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMembers?.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="fw-bold text-dark">{m.name}</div>
                        <small className="text-muted">{m.email}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{m.membership_name || 'No Plan'}</span>
                      </td>
                      <td>{m.join_date}</td>
                      <td>
                        <span className={`badge-status badge-status-${m.status}`}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!recentMembers || recentMembers.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">No recent members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-custom">
            <div className="card-header-clean">
              <h6 className="fw-bold m-0 text-dark">Today's Attendance Check-Ins</h6>
              <Link to="/admin/attendance" className="small text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance?.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="fw-bold text-dark">{a.member_name}</div>
                        <small className="text-muted">{a.membership_name}</small>
                      </td>
                      <td>{a.date}</td>
                      <td>
                        <span className="text-secondary small d-flex align-items-center gap-1">
                          <Clock size={12} /> {a.check_in_time}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status badge-status-${a.status}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(!recentAttendance || recentAttendance.length === 0) && (
                    <tr>
                      <td colSpan="4" className="text-center py-3 text-muted">No attendance recorded today.</td>
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

export default AdminDashboard;
