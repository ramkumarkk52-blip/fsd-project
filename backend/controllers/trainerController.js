const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all trainers
// @route   GET /api/trainers
// @access  Public / Authenticated
const getAllTrainers = async (req, res, next) => {
  try {
    const { search, specialization } = req.query;

    let query = `
      SELECT t.id, t.user_id, t.specialization, t.experience_years, t.bio, t.hourly_rate, t.hire_date,
             u.name, u.email, u.phone, u.avatar_url, u.status,
             (SELECT COUNT(*) FROM members WHERE trainer_id = t.id) AS assigned_members_count
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR t.specialization LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (specialization) {
      query += ` AND t.specialization LIKE ?`;
      params.push(`%${specialization}%`);
    }

    query += ` ORDER BY u.name ASC`;

    const [trainers] = await pool.query(query, params);

    res.json({
      success: true,
      count: trainers.length,
      trainers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer by ID
// @route   GET /api/trainers/:id
// @access  Authenticated
const getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [trainers] = await pool.query(
      `SELECT t.id, t.user_id, t.specialization, t.experience_years, t.bio, t.hourly_rate, t.hire_date,
              u.name, u.email, u.phone, u.address, u.avatar_url, u.status
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const trainer = trainers[0];

    // Fetch assigned members
    const [assignedMembers] = await pool.query(
      `SELECT m.id, m.gender, m.join_date, m.status, u.name, u.email, u.phone, mem.name AS membership_name
       FROM members m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       WHERE m.trainer_id = ?`,
      [id]
    );

    // Fetch trainer schedules
    const [schedules] = await pool.query(
      `SELECT s.*, u.name AS member_name
       FROM schedules s
       LEFT JOIN members m ON s.member_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       WHERE s.trainer_id = ?
       ORDER BY s.session_date DESC, s.start_time ASC`,
      [id]
    );

    res.json({
      success: true,
      trainer: {
        ...trainer,
        assignedMembers,
        schedules
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create trainer (Admin)
// @route   POST /api/trainers
// @access  Admin
const createTrainer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, password, phone, address, specialization, experience_years, bio, hourly_rate, hire_date } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and specialization are required.' });
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
       VALUES (?, ?, ?, 'trainer', ?, ?, 'active')`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, address || null]
    );

    const userId = userRes.insertId;

    const [trainerRes] = await connection.query(
      `INSERT INTO trainers (user_id, specialization, experience_years, bio, hourly_rate, hire_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        specialization,
        experience_years ? parseInt(experience_years) : 1,
        bio || null,
        hourly_rate ? parseFloat(hourly_rate) : 0.0,
        hire_date || new Date().toISOString().split('T')[0]
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Trainer added successfully!',
      trainerId: trainerRes.insertId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Update trainer
// @route   PUT /api/trainers/:id
// @access  Admin (or Trainer updating own bio)
const updateTrainer = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, email, phone, address, specialization, experience_years, bio, hourly_rate, status } = req.body;

    const [trainers] = await connection.query('SELECT user_id FROM trainers WHERE id = ?', [id]);
    if (trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const userId = trainers[0].user_id;

    // Authorization: trainer can only update their own trainer profile unless admin
    if (req.user.role === 'trainer' && req.user.trainer_id != id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only update your own profile.' });
    }

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
      `UPDATE trainers SET
        specialization = COALESCE(?, specialization),
        experience_years = COALESCE(?, experience_years),
        bio = COALESCE(?, bio),
        hourly_rate = COALESCE(?, hourly_rate)
       WHERE id = ?`,
      [specialization, experience_years, bio, hourly_rate, id]
    );

    await connection.commit();

    res.json({ success: true, message: 'Trainer updated successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Assign trainer to member(s)
// @route   POST /api/trainers/:id/assign
// @access  Admin
const assignTrainerToMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide member IDs to assign.' });
    }

    await pool.query(
      `UPDATE members SET trainer_id = ? WHERE id IN (?)`,
      [id, memberIds]
    );

    res.json({
      success: true,
      message: `Successfully assigned ${memberIds.length} member(s) to trainer!`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trainer
// @route   DELETE /api/trainers/:id
// @access  Admin
const deleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [trainers] = await pool.query('SELECT user_id FROM trainers WHERE id = ?', [id]);
    if (trainers.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    // Cascade delete via user
    await pool.query('DELETE FROM users WHERE id = ?', [trainers[0].user_id]);

    res.json({ success: true, message: 'Trainer removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  assignTrainerToMembers,
  deleteTrainer
};
