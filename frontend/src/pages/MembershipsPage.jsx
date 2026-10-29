import React, { useState, useEffect } from 'react';
import { membershipApi, subscriptionApi } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Plus, Check, Edit, Trash2, ShieldCheck, Zap, RefreshCw, Calendar, Clock, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const MembershipsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  const [memberships, setMemberships] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: 1,
    price: 49.99,
    features: '',
    status: 'active'
  });

  const [paymentMethod, setPaymentMethod] = useState('card');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await membershipApi.getAll({});
      if (res.data.success) {
        setMemberships(res.data.memberships);
      }

      if (isMember) {
        const subRes = await subscriptionApi.getMy();
        if (subRes.data.success && subRes.data.subscriptions.length > 0) {
          setMySubscription(subRes.data.subscriptions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load membership plans:', err);
      setAlert({ type: 'danger', message: 'Failed to load membership plans.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      duration_months: 1,
      price: 49.99,
      features: 'Full Gym Access, Locker Room, Free Fitness Assessment',
      status: 'active'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    const featuresStr = Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '';
    setFormData({
      name: plan.name,
      description: plan.description || '',
      duration_months: plan.duration_months,
      price: plan.price,
      features: featuresStr,
      status: plan.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenSubscribe = (plan) => {
    setSelectedPlan(plan);
    setIsSubscribeModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split(',').map((f) => f.trim()).filter(Boolean)
      };
      const res = await membershipApi.create(payload);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Membership plan created successfully!' });
        setIsAddModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to create plan.' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split(',').map((f) => f.trim()).filter(Boolean)
      };
      const res = await membershipApi.update(selectedPlan.id, payload);
      if (res.data.success) {
        setAlert({ type: 'success', message: 'Membership plan updated.' });
        setIsEditModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to update plan.' });
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete membership plan "${name}"?`)) {
      try {
        const res = await membershipApi.delete(id);
        if (res.data.success) {
          setAlert({ type: 'success', message: `Plan ${name} deleted successfully.` });
          fetchPlans();
        }
      } catch (err) {
        setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete plan.' });
      }
    }
  };

  const handleConfirmSubscribe = async (e) => {
    e.preventDefault();
    try {
      const res = await subscriptionApi.create({
        membership_id: selectedPlan.id,
        payment_method: paymentMethod,
        payment_status: 'paid'
      });
      if (res.data.success) {
        setAlert({ type: 'success', message: `Subscribed to ${selectedPlan.name} successfully!` });
        setIsSubscribeModalOpen(false);
        fetchPlans();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Subscription failed.' });
    }
  };

  const isCurrentExpired = mySubscription && (
    mySubscription.status === 'expired' || new Date(mySubscription.end_date) < new Date()
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0 text-dark">Membership Packages & Plans</h3>
          <p className="text-muted small m-0">Basic, Standard, and Premium tiers with complete pricing and duration options</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Plus size={16} /> Create New Plan
          </button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Member Active/Expired Status Banner */}
      {isMember && mySubscription && (
        <div className={`card-custom p-4 mb-4 border-start border-4 ${isCurrentExpired ? 'border-danger bg-danger-subtle' : 'border-success bg-white'}`}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-bold text-uppercase">MY CURRENT MEMBERSHIP:</span>
                <span className={`badge-status ${isCurrentExpired ? 'badge-status-expired' : 'badge-status-active'}`}>
                  {isCurrentExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <h4 className="fw-bold text-dark m-0 mt-1">{mySubscription.membership_name}</h4>
              <div className="small text-secondary mt-1 d-flex flex-wrap gap-3">
                <span>📅 <strong>Start Date:</strong> {mySubscription.start_date}</span>
                <span>⏰ <strong>Expiry Date:</strong> {mySubscription.end_date}</span>
                <span>💵 <strong>Paid:</strong> ${parseFloat(mySubscription.amount_paid).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const plan = memberships.find((m) => m.id === mySubscription.membership_id) || memberships[0];
                handleOpenSubscribe(plan);
              }}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 px-3 py-2 shadow-sm"
            >
              <RefreshCw size={15} /> {isCurrentExpired ? 'Renew Expired Membership' : 'Extend / Renew Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Membership Plan Cards */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading membership tiers...</p>
          </div>
        ) : memberships.length > 0 ? (
          memberships.map((plan, idx) => {
            const isPopular = idx === 1 || plan.name.toLowerCase().includes('standard') || plan.name.toLowerCase().includes('pro');
            return (
              <div key={plan.id} className="col-12 col-md-6 col-xl-3">
                <div className={`plan-card ${isPopular ? 'popular' : ''}`}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark m-0">{plan.name}</h5>
                    {isAdmin && (
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => handleOpenEdit(plan)} className="btn btn-sm btn-light border p-1" title="Edit">
                          <Edit size={14} className="text-primary" />
                        </button>
                        <button onClick={() => handleDelete(plan.id, plan.name)} className="btn btn-sm btn-light border p-1" title="Delete">
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-muted small mb-3" style={{ minHeight: '48px' }}>
                    {plan.description || 'Access our high performance fitness center facilities and expert guidance.'}
                  </p>

                  <div className="plan-price mb-3">
                    ${parseFloat(plan.price).toFixed(2)}
                    <span> / {plan.duration_months} mo</span>
                  </div>

                  <hr className="my-3 opacity-25" />

                  <div className="mb-4 flex-fill">
                    <div className="small fw-bold text-secondary text-uppercase mb-2">Included Features:</div>
                    <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                      {plan.features?.map((feat, i) => (
                        <li key={i} className="small d-flex align-items-start gap-2">
                          <Check size={16} className="text-success flex-shrink-0 mt-1" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isMember && (
                    <button
                      onClick={() => handleOpenSubscribe(plan)}
                      className={`btn w-100 py-2 fw-semibold rounded-3 ${isPopular ? 'btn-primary' : 'btn-outline-primary'}`}
                    >
                      {mySubscription?.membership_id === plan.id ? 'Renew This Plan' : 'Subscribe & Activate'}
                    </button>
                  )}

                  {isAdmin && (
                    <div className="text-center pt-2 border-top">
                      <small className="text-muted">
                        Active Members: <strong>{plan.active_members_count || 0}</strong> • Status: <span className="text-capitalize text-success fw-bold">{plan.status}</span>
                      </small>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12 text-center py-5 text-muted">
            No membership plans available yet.
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Membership Plan">
        <form onSubmit={handleCreateSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Plan Name *</label>
            <input
              type="text"
              className="form-control form-control-sm"
              required
              placeholder="e.g. Basic Plan, Standard Plan, or Premium Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Duration (Months) *</label>
              <input
                type="number"
                min="1"
                className="form-control form-control-sm"
                required
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Description</label>
            <textarea
              className="form-control form-control-sm"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Features (Comma Separated) *</label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              placeholder="Full Gym Floor Access, Locker Room, Free Fitness Assessment"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            ></textarea>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Save Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Membership Plan">
        <form onSubmit={handleEditSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Plan Name *</label>
            <input
              type="text"
              className="form-control form-control-sm"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small fw-semibold">Duration (Months) *</label>
              <input
                type="number"
                min="1"
                className="form-control form-control-sm"
                required
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control form-control-sm"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Description</label>
            <textarea
              className="form-control form-control-sm"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Features (Comma Separated)</label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            ></textarea>
          </div>
          <div className="modal-footer-custom mt-4">
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Update Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Subscribe / Renewal Modal */}
      <Modal isOpen={isSubscribeModalOpen} onClose={() => setIsSubscribeModalOpen(false)} title="Confirm Subscription / Renewal">
        {selectedPlan && (
          <form onSubmit={handleConfirmSubscribe}>
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <div className="small text-muted fw-bold">SELECTED PLAN:</div>
              <h5 className="fw-bold text-dark m-0">{selectedPlan.name}</h5>
              <div className="fs-4 fw-bold text-primary mt-1">
                ${parseFloat(selectedPlan.price).toFixed(2)}
                <span className="small text-muted fw-normal"> / {selectedPlan.duration_months} months</span>
              </div>
              <p className="small text-muted mt-2 mb-0">{selectedPlan.description}</p>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Payment Method</label>
              <select
                className="form-select form-select-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="card">Credit / Debit Card</option>
                <option value="upi">UPI / Instant Pay</option>
                <option value="netbanking">Net Banking</option>
                <option value="cash">Pay at Gym Reception (Cash)</option>
              </select>
            </div>

            <p className="small text-muted">
              By confirming, this subscription will immediately activate for your account, updating your start and expiry dates in the system.
            </p>

            <div className="modal-footer-custom mt-4">
              <button type="button" className="btn btn-light btn-sm" onClick={() => setIsSubscribeModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm px-3">
                Confirm & Activate
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MembershipsPage;
