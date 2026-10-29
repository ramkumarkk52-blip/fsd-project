const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all members with filters & search
// @route   GET /api/members
// @access  Admin, Trainer
const getAllMembers = async (req, res, next) => {
  try {
    const { search, status, membership_id, trainer_id } = req.query;

    let query = `
      SELECT m.id, m.user_id, m.gender, m.dob, m.emergency_contact, m.health_conditions, m.join_date, m.status,
             u.name, u.email, u.phone, u.address, u.avatar_url,
             mem.id AS membership_id, mem.name AS membership_name, mem.price AS membership_price,
             t.id AS trainer_id, tu.name AS trainer_name,
             (SELECT end_date FROM subscriptions WHERE member_id = m.id ORDER BY end_date DESC LIMIT 1) AS subscription_end_date,
             (SELECT status FROM subscriptions WHERE member_id = m.id ORDER BY end_date DESC LIMIT 1) AS subscription_status
      FROM members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN memberships mem ON m.membership_id = mem.id
      LEFT JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      WHERE 1=1
    `;
    const params = [];

    // If logged in as trainer, automatically scope to their assigned members unless admin
    if (req.user.role === 'trainer' && req.user.trainer_id) {
      query += ` AND m.trainer_id = ?`;
      params.push(req.user.trainer_id);
    } else if (trainer_id) {
      query += ` AND m.trainer_id = ?`;
      params.push(trainer_id);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    if (membership_id) {
      query += ` AND m.membership_id = ?`;
      params.push(membership_id);
    }

    query += ` ORDER BY m.created_at DESC`;

    const [members] = await pool.query(query, params);

    res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get member by ID
// @route   GET /api/members/:id
// @access  Admin, Trainer, Member (own)
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check authorization: if member, can only view self
    if (req.user.role === 'member' && req.user.member_id != id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own profile.' });
    }

    const [members] = await pool.query(
      `SELECT m.id, m.user_id, m.gender, m.dob, m.emergency_contact, m.health_conditions, m.join_date, m.status,
              u.name, u.email, u.phone, u.address, u.avatar_url,
              mem.id AS membership_id, mem.name AS membership_name, mem.price AS membership_price, mem.duration_months, mem.features,
              t.id AS trainer_id, tu.name AS trainer_name, tu.email AS trainer_email, tu.phone AS trainer_phone, t.specialization AS trainer_specialization
       FROM members m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       LEFT JOIN trainers t ON m.trainer_id = t.id
       LEFT JOIN users tu ON t.user_id = tu.id
       WHERE m.id = ?`,
      [id]
    );

    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const member = members[0];

    // Fetch active subscriptions
    const [subscriptions] = await pool.query(
      `SELECT s.*, mem.name AS membership_name
       FROM subscriptions s
       JOIN memberships mem ON s.membership_id = mem.id
       WHERE s.member_id = ?
       ORDER BY s.end_date DESC`,
      [id]
    );

    // Fetch recent workout plans
    const [workoutPlans] = await pool.query(
      `SELECT w.*, tu.name AS trainer_name
       FROM workout_plans w
       JOIN trainers t ON w.trainer_id = t.id
       JOIN users tu ON t.user_id = tu.id
       WHERE w.member_id = ?
       ORDER BY w.created_at DESC`,
      [id]
    );

    // Fetch recent attendance
    const [attendance] = await pool.query(
      `SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC LIMIT 10`,
      [id]
    );

    // Fetch latest fitness progress
    const [progress] = await pool.query(
      `SELECT * FROM fitness_progress WHERE member_id = ? ORDER BY date DESC LIMIT 5`,
      [id]
    );

    res.json({
      success: true,
      member: {
        ...member,
        subscriptions,
        workoutPlans,
        attendance,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new member (Admin)
// @route   POST /api/members
// @access  Admin
const createMember = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, password, phone, address, gender, dob, emergency_contact, health_conditions, membership_id, trainer_id, join_date, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [userRes] = await connection.query(
      `INSERT INTO users (name, email, password, role, phone, address, status)
       VALUES (?, ?, ?, 'member', ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, address || null, status || 'active']
    );

    const userId = userRes.insertId;
    const memberJoinDate = join_date || new Date().toISOString().split('T')[0];

    const [memberRes] = await connection.query(
      `INSERT INTO members (user_id, trainer_id, membership_id, gender, dob, emergency_contact, health_conditions, join_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        trainer_id ? parseInt(trainer_id) : null,
        membership_id ? parseInt(membership_id) : null,
        gender || 'male',
        dob || null,
        emergency_contact || null,
        health_conditions || null,
        memberJoinDate,
        status || 'active'
      ]
    );

    const memberId = memberRes.insertId;

    // Optional initial subscription if membership is selected
    if (membership_id) {
      const [memberships] = await connection.query('SELECT duration_months, price FROM memberships WHERE id = ?', [membership_id]);
      if (memberships.length > 0) {
        const plan = memberships[0];
        const startDate = new Date(memberJoinDate);
        const endDate = new Date(memberJoinDate);
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        await connection.query(
          `INSERT INTO subscriptions (member_id, membership_id, start_date, end_date, amount_paid, payment_method, payment_status, status)
           VALUES (?, ?, ?, ?, ?, 'card', 'paid', 'active')`,
          [memberId, membership_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], plan.price]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Member registered successfully!',
      memberId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Admin (or Trainer to update notes)
const updateMember = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, email, phone, address, gender, dob, emergency_contact, health_conditions, membership_id, trainer_id, status } = req.body;

    const [members] = await connection.query('SELECT user_id FROM members WHERE id = ?', [id]);
    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const userId = members[0].user_id;

    await connection.beginTransaction();

    if (name || email || phone || address || status) {
      await connection.query(
        `UPDATE users SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          status = COALESCE(?, status)
         WHERE id = ?`,
        [name, email ? email.toLowerCase().trim() : null, phone, address, status, userId]
      );
    }

    await connection.query(
      `UPDATE members SET
        trainer_id = ?,
        membership_id = ?,
        gender = COALESCE(?, gender),
        dob = ?,
        emergency_contact = COALESCE(?, emergency_contact),
        health_conditions = ?,
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        trainer_id === '' || trainer_id === null ? null : parseInt(trainer_id),
        membership_id === '' || membership_id === null ? null : parseInt(membership_id),
        gender,
        dob || null,
        emergency_contact,
        health_conditions,
        status,
        id
      ]
    );

    await connection.commit();

    res.json({ success: true, message: 'Member updated successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Admin
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [members] = await pool.query('SELECT user_id FROM members WHERE id = ?', [id]);
    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Deleting the user will cascade delete the member and all associated rows
    await pool.query('DELETE FROM users WHERE id = ?', [members[0].user_id]);

    res.json({ success: true, message: 'Member deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};
