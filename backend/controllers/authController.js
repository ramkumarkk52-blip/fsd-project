const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fitness_center_super_secret_jwt_key_2026_!@#$',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new member
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, password, phone, address, gender, dob, emergency_contact, membership_id, trainer_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    await connection.beginTransaction();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password, role, phone, address, status)
       VALUES (?, ?, ?, 'member', ?, ?, 'active')`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, address || null]
    );

    const userId = userResult.insertId;

    // Insert member record
    const today = new Date().toISOString().split('T')[0];
    const [memberResult] = await connection.query(
      `INSERT INTO members (user_id, trainer_id, membership_id, gender, dob, emergency_contact, join_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        userId,
        trainer_id ? parseInt(trainer_id) : null,
        membership_id ? parseInt(membership_id) : null,
        gender || 'male',
        dob || null,
        emergency_contact || null,
        today
      ]
    );

    const memberId = memberResult.insertId;

    // If membership_id provided, create initial subscription
    if (membership_id) {
      const [memberships] = await connection.query('SELECT duration_months, price FROM memberships WHERE id = ?', [membership_id]);
      if (memberships.length > 0) {
        const plan = memberships[0];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        await connection.query(
          `INSERT INTO subscriptions (member_id, membership_id, start_date, end_date, amount_paid, payment_method, payment_status, status)
           VALUES (?, ?, ?, ?, ?, 'card', 'paid', 'active')`,
          [memberId, membership_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], plan.price]
        );
      }
    }

    await connection.commit();

    const token = generateToken(userId, 'member');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to the Fitness Center.',
      token,
      user: {
        id: userId,
        name,
        email: email.toLowerCase().trim(),
        role: 'member',
        phone,
        member_id: memberId
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Login user (Admin, Trainer, Member)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.phone, u.address, u.avatar_url, u.status,
              t.id AS trainer_id, t.specialization,
              m.id AS member_id, m.membership_id
       FROM users u
       LEFT JOIN trainers t ON u.id = t.user_id
       LEFT JOIN members m ON u.id = m.user_id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.role);

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.address, u.avatar_url, u.status, u.created_at,
              t.id AS trainer_id, t.specialization, t.experience_years, t.bio, t.hourly_rate,
              m.id AS member_id, m.trainer_id AS assigned_trainer_id, m.membership_id, m.gender, m.dob, m.join_date,
              mem.name AS membership_name
       FROM users u
       LEFT JOIN trainers t ON u.id = t.user_id
       LEFT JOIN members m ON u.id = m.user_id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar_url, bio, specialization } = req.body;

    await pool.query(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address), avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [name, phone, address, avatar_url, req.user.id]
    );

    // If trainer, update trainer info
    if (req.user.role === 'trainer' && req.user.trainer_id) {
      await pool.query(
        `UPDATE trainers SET bio = COALESCE(?, bio), specialization = COALESCE(?, specialization)
         WHERE id = ?`,
        [bio, specialization, req.user.trainer_id]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
