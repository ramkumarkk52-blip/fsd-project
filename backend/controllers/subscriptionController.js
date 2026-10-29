const pool = require('../config/db');

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Admin
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, payment_status, search } = req.query;

    let query = `
      SELECT s.*,
             u.name AS member_name, u.email AS member_email, u.phone AS member_phone,
             mem.name AS membership_name, mem.duration_months
      FROM subscriptions s
      JOIN members m ON s.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN memberships mem ON s.membership_id = mem.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    if (payment_status) {
      query += ` AND s.payment_status = ?`;
      params.push(payment_status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR mem.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.end_date DESC`;

    const [subscriptions] = await pool.query(query, params);

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subscriptions for logged-in member
// @route   GET /api/subscriptions/my
// @access  Member
const getMySubscriptions = async (req, res, next) => {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ success: false, message: 'Current user has no member record.' });
    }

    const [subscriptions] = await pool.query(
      `SELECT s.*, mem.name AS membership_name, mem.duration_months, mem.description, mem.features
       FROM subscriptions s
       JOIN memberships mem ON s.membership_id = mem.id
       WHERE s.member_id = ?
       ORDER BY s.end_date DESC`,
      [req.user.member_id]
    );

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or renew a subscription
// @route   POST /api/subscriptions
// @access  Admin, Member
const createSubscription = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    let { member_id, membership_id, start_date, payment_method, payment_status, notes } = req.body;

    // If role is member, force member_id to be req.user.member_id
    if (req.user.role === 'member') {
      member_id = req.user.member_id;
    }

    if (!member_id || !membership_id) {
      return res.status(400).json({ success: false, message: 'Member ID and Membership ID are required.' });
    }

    const [memberships] = await connection.query('SELECT * FROM memberships WHERE id = ?', [membership_id]);
    if (memberships.length === 0) {
      return res.status(404).json({ success: false, message: 'Membership plan not found.' });
    }

    const plan = memberships[0];

    // Determine start date: if there is an active subscription with future end date, chain from that date, otherwise start today
    const [latestSub] = await connection.query(
      `SELECT end_date FROM subscriptions WHERE member_id = ? AND status = 'active' ORDER BY end_date DESC LIMIT 1`,
      [member_id]
    );

    let start = start_date ? new Date(start_date) : new Date();
    if (latestSub.length > 0) {
      const activeEnd = new Date(latestSub[0].end_date);
      if (activeEnd > start) {
        start = new Date(activeEnd);
        start.setDate(start.getDate() + 1);
      }
    }

    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.duration_months);

    await connection.beginTransaction();

    // Mark previous active subscriptions as renewed if new subscription takes over
    await connection.query(
      `UPDATE subscriptions SET status = 'renewed' WHERE member_id = ? AND status = 'active'`,
      [member_id]
    );

    // Insert new subscription
    const [result] = await connection.query(
      `INSERT INTO subscriptions (member_id, membership_id, start_date, end_date, amount_paid, payment_method, payment_status, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        member_id,
        membership_id,
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        plan.price,
        payment_method || 'card',
        payment_status || 'paid',
        notes || 'Membership Subscription'
      ]
    );

    // Also update member's current membership_id
    await connection.query(
      `UPDATE members SET membership_id = ?, status = 'active' WHERE id = ?`,
      [membership_id, member_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Subscription created and activated successfully!',
      subscriptionId: result.insertId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update subscription status
// @route   PUT /api/subscriptions/:id
// @access  Admin
const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, payment_status, payment_method, notes, end_date } = req.body;

    await pool.query(
      `UPDATE subscriptions SET
        status = COALESCE(?, status),
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method),
        notes = COALESCE(?, notes),
        end_date = COALESCE(?, end_date)
       WHERE id = ?`,
      [status, payment_status, payment_method, notes, end_date, id]
    );

    res.json({ success: true, message: 'Subscription record updated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSubscriptions,
  getMySubscriptions,
  createSubscription,
  updateSubscription
};
