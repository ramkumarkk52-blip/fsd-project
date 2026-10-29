import React, { useState, useEffect } from 'react';
import { subscriptionApi, membershipApi, memberApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Search, Plus, RefreshCw, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const SubscriptionsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  const [subscriptions, setSubscriptions] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filters & Tabs
  const [statusFilter, setStatusFilter] = useState('');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  // Form State
  const [renewPlanId, setRenewPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const res = await subscriptionApi.getAll({
          status: statusFilter || undefined,
          search
        });
        if (res.data.success) {
          let list = res.data.subscriptions;
          if (showExpiringOnly) {
            const today = new Date();
            const in30Days = new Date();
            in30Days.setDate(today.getDate() + 30);
            list = list.filter((s) => {
              const end = new Date(s.end_date);
              return s.status === 'active' && end >= today && end <= in30Days;
            });
          }
          setSubscriptions(list);
        }
      } else {
        const res = await subscriptionApi.getMy();
        if (res.data.success) {
          let list = res.data.subscriptions;
          if (showExpiringOnly) {
            const today = new Date();
            const in30Days = new Date();
            in30Days.setDate(today.getDate() + 30);
            list = list.filter((s) => {
              const end = new Date(s.end_date);
              return s.status === 'active' && end >= today && end <= in30Days;
            });
          }
          setSubscriptions(list);
        }
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setAlert({ type: 'danger', message: 'Failed to load subscription records.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        membershipApi.getAll({}),
        isAdmin ? memberApi.getAll({}) : Promise.resolve({ data: { members: [] } })
      ]);
      if (pRes.data.success) setMemberships(pRes.data.memberships);
      if (mRes.data?.members) setMembers(mRes.data.members);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscriptions();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, search, showExpiringOnly]);

  // When plan changes in renew modal, calculate default expiry date
  useEffect(() => {
    if (renewPlanId && memberships.length > 0) {
      const plan = memberships.find((m) => m.id == renewPlanId);
      if (plan) {
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + plan.duration_months);
        setExpiryDate(end.toISOString().split('T')[0]);
      }
    }
  }, [renewPlanId, startDate, memberships]);

  const handleOpenRenew = (sub) => {
    setSelectedSub(sub);
    setRenewPlanId(sub.membership_id);

    // Calculate start date (chain after current active end date if future)
    const today = new Date();
    const currentEnd = new Date(sub.end_date);
    let start = today;
    if (currentEnd > today) {
      start = new Date(currentEnd);
      start.setDate(start.getDate() + 1);
    }
    const startStr = start.toISOString().split('T')[0];
    setStartDate(startStr);

    const plan = memberships.find((m) => m.id == sub.membership_id);
    const duration = plan ? plan.duration_months : 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + duration);
    setExpiryDate(end.toISOString().split('T')[0]);

    setPaymentMethod('card');
    setPaymentStatus('paid');
    setNotes(`Renewed plan: ${sub.membership_name}`);
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      const memberId = isAdmin ? selectedSub.member_id : user?.member_id;
      const res = await subscriptionApi.create({
        member_id: memberId,
        membership_id: renewPlanId,
        start_date: startDate,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes
      });
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Subscription successfully renewed with updated expiry date!' });
        setIsRenewModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Renewal failed.' });
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await subscriptionApi.update(id, { status: newStatus });
      if (res.data.success) {
        setAlert({ type: 'success', message: `Subscription marked as ${newStatus}.` });
        fetchSubscriptions();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to update status.' });
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">
            {isAdmin ? 'Subscription & Renewal Operations' : 'My Membership Subscriptions'}
          </h3>
          <p className="text-muted small m-0">Track upcoming expirations, manage renewals, and update expiry dates</p>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filter and Quick Tabs Bar */}
      <div className="filter-bar">
        {isAdmin && (
          <div className="search-input-group flex-fill" style={{ maxWidth: '300px' }}>
            <Search size={16} />
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by member or plan name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <button
            type="button"
            className={`btn btn-sm ${showExpiringOnly ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning'}`}
            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
          >
            <AlertTriangle size={14} className="me-1" />
            {showExpiringOnly ? '✓ Showing Upcoming Expirations (< 30 days)' : 'Show Upcoming Expirations'}
          </button>

          {isAdmin && (
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="card-custom">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                {isAdmin && <th>Member</th>}
                <th>Plan Name</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Amount Paid</th>
                <th>Payment Status</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length > 0 ? (
                subscriptions.map((s) => {
                  const isExpiringSoon = new Date(s.end_date) > new Date() &&
                    (new Date(s.end_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30;
                  return (
                    <tr key={s.id}>
                      {isAdmin && (
                        <td>
                          <div className="fw-bold text-dark">{s.member_name}</div>
                          <small className="text-muted">{s.member_email}</small>
                        </td>
                      )}
                      <td>
                        <span className="fw-semibold text-primary">{s.membership_name}</span>
                      </td>
                      <td>{s.start_date}</td>
                      <td>
                        <strong className={isExpiringSoon ? 'text-warning' : 'text-dark'}>
                          {s.end_date}
                        </strong>
                        {isExpiringSoon && s.status === 'active' && (
                          <span className="badge bg-warning-subtle text-warning border ms-1 small">Expiring Soon</span>
                        )}
                      </td>
                      <td className="fw-bold text-success">
                        ${parseFloat(s.amount_paid).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${s.payment_status === 'paid' ? 'bg-success-subtle text-success border' : 'bg-warning-subtle text-warning border'}`}>
                          {s.payment_status || 'paid'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border text-uppercase">
                          {s.payment_method}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status badge-status-${s.status}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => handleOpenRenew(s)}
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            title="Renew Membership & Update Expiry"
                          >
                            <RefreshCw size={13} /> Renew
                          </button>
                          {isAdmin && s.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'expired')}
                              className="btn btn-sm btn-outline-secondary"
                              title="Mark as Expired"
                            >
                              Expire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="text-center py-4 text-muted">
                    {showExpiringOnly ? 'No subscriptions expiring in the next 30 days.' : 'No subscription records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew Modal */}
      <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renew Membership & Update Expiry Date">
        {selectedSub && (
          <form onSubmit={handleRenewSubmit}>
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <div className="small text-muted fw-semibold">RENEWING MEMBERSHIP FOR:</div>
              <h5 className="fw-bold text-dark m-0">{selectedSub.member_name || user?.name}</h5>
              <div className="small text-muted mt-1">
                Previous Plan: <span className="fw-semibold text-dark">{selectedSub.membership_name}</span> (Ended: {selectedSub.end_date})
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Choose Renewal Plan *</label>
              <select
                className="form-select form-select-sm"
                value={renewPlanId}
                onChange={(e) => setRenewPlanId(e.target.value)}
                required
              >
                {memberships.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${parseFloat(p.price).toFixed(2)} for {p.duration_months} months)
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Renewal Start Date *</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">New Expiry Date *</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Payment Status</label>
                <select
                  className="form-select form-select-sm"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Payment Mode</label>
                <select
                  className="form-select form-select-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="cash">Cash / Reception</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Renewal Notes</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-footer-custom mt-4">
              <button type="button" className="btn btn-light btn-sm" onClick={() => setIsRenewModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm px-3">
                Confirm & Renew
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
