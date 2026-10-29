const pool = require('../config/db');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Authenticated
const getAllSchedules = async (req, res, next) => {
  try {
    const { trainer_id, member_id, session_date, status, session_type } = req.query;

    let query = `
      SELECT s.*,
             u_t.name AS trainer_name, t.specialization,
             u_m.name AS member_name, u_m.email AS member_email, u_m.phone AS member_phone
      FROM schedules s
      JOIN trainers t ON s.trainer_id = t.id
      JOIN users u_t ON t.user_id = u_t.id
      LEFT JOIN members m ON s.member_id = m.id
      LEFT JOIN users u_m ON m.user_id = u_m.id
      WHERE 1=1
    `;
    const params = [];

    // Role-specific scoping
    if (req.user.role === 'trainer') {
      query += ` AND s.trainer_id = ?`;
      params.push(req.user.trainer_id);
    } else if (req.user.role === 'member') {
      // Member sees sessions assigned to them OR open group classes
      query += ` AND (s.member_id = ? OR s.session_type = 'group_class')`;
      params.push(req.user.member_id);
    }

    if (trainer_id && req.user.role !== 'trainer') {
      query += ` AND s.trainer_id = ?`;
      params.push(trainer_id);
    }

    if (member_id && req.user.role === 'admin') {
      query += ` AND s.member_id = ?`;
      params.push(member_id);
    }

    if (session_date) {
      query += ` AND s.session_date = ?`;
      params.push(session_date);
    }

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    if (session_type) {
      query += ` AND s.session_type = ?`;
      params.push(session_type);
    }

    query += ` ORDER BY s.session_date ASC, s.start_time ASC`;

    const [schedules] = await pool.query(query, params);

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Authenticated
const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [schedules] = await pool.query(
      `SELECT s.*,
              u_t.name AS trainer_name, t.specialization,
              u_m.name AS member_name, u_m.email AS member_email
       FROM schedules s
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u_t ON t.user_id = u_t.id
       LEFT JOIN members m ON s.member_id = m.id
       LEFT JOIN users u_m ON m.user_id = u_m.id
       WHERE s.id = ?`,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule session not found.' });
    }

    res.json({ success: true, schedule: schedules[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new schedule session
// @route   POST /api/schedules
// @access  Admin, Trainer
const createSchedule = async (req, res, next) => {
  try {
    let { trainer_id, member_id, session_title, session_type, session_date, start_time, end_time, capacity, room, status, notes } = req.body;

    if (req.user.role === 'trainer') {
      trainer_id = req.user.trainer_id;
    }

    if (!trainer_id || !session_title || !session_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Trainer, title, date, start time, and end time are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO schedules (trainer_id, member_id, session_title, session_type, session_date, start_time, end_time, capacity, room, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trainer_id,
        member_id ? parseInt(member_id) : null,
        session_title.trim(),
        session_type || 'personal_training',
        session_date,
        start_time,
        end_time,
        capacity ? parseInt(capacity) : 1,
        room || 'Main Gym Floor',
        status || 'scheduled',
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Training session scheduled successfully!',
      scheduleId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule session
// @route   PUT /api/schedules/:id
// @access  Admin, Trainer
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { member_id, session_title, session_type, session_date, start_time, end_time, capacity, room, status, notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule session not found.' });
    }

    if (req.user.role === 'trainer' && existing[0].trainer_id !== req.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this schedule session.' });
    }

    await pool.query(
      `UPDATE schedules SET
        member_id = ?,
        session_title = COALESCE(?, session_title),
        session_type = COALESCE(?, session_type),
        session_date = COALESCE(?, session_date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        capacity = COALESCE(?, capacity),
        room = COALESCE(?, room),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        member_id === '' ? null : (member_id !== undefined ? member_id : existing[0].member_id),
        session_title,
        session_type,
        session_date,
        start_time,
        end_time,
        capacity,
        room,
        status,
        notes,
        id
      ]
    );

    res.json({ success: true, message: 'Schedule session updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Book / Join a session
// @route   POST /api/schedules/:id/book
// @access  Member
const bookSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user.member_id) {
      return res.status(400).json({ success: false, message: 'Current user has no member record.' });
    }

    const [existing] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const session = existing[0];
    if (session.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'This session is no longer available.' });
    }

    if (session.member_id && session.member_id === req.user.member_id) {
      return res.status(400).json({ success: false, message: 'You are already registered for this session.' });
    }

    if (session.session_type === 'personal_training' && session.member_id) {
      return res.status(400).json({ success: false, message: 'This slot is already booked.' });
    }

    await pool.query('UPDATE schedules SET member_id = ? WHERE id = ?', [req.user.member_id, id]);

    res.json({ success: true, message: 'Session booked successfully!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / Cancel schedule session
// @route   DELETE /api/schedules/:id
// @access  Admin, Trainer
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (req.user.role === 'trainer' && existing[0].trainer_id !== req.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this schedule session.' });
    }

    await pool.query('DELETE FROM schedules WHERE id = ?', [id]);

    res.json({ success: true, message: 'Session removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  bookSchedule,
  deleteSchedule
};
