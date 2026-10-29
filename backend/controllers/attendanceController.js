const pool = require('../config/db');

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Admin, Trainer
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, member_id, status, search } = req.query;

    let query = `
      SELECT a.*,
             u.name AS member_name, u.email AS member_email, u.phone AS member_phone,
             mem.name AS membership_name,
             t.id AS trainer_id, tu.name AS trainer_name
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      JOIN users u ON m.user_id = u.id
      LEFT JOIN memberships mem ON m.membership_id = mem.id
      LEFT JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      WHERE 1=1
    `;
    const params = [];

    // If logged in as trainer, filter to their assigned members
    if (req.user.role === 'trainer' && req.user.trainer_id) {
      query += ` AND m.trainer_id = ?`;
      params.push(req.user.trainer_id);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (member_id) {
      query += ` AND a.member_id = ?`;
      params.push(member_id);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.date DESC, a.check_in_time DESC`;

    const [attendance] = await pool.query(query, params);

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance for logged-in member
// @route   GET /api/attendance/my
// @access  Member
const getMyAttendance = async (req, res, next) => {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ success: false, message: 'Current user has no member record.' });
    }

    const [attendance] = await pool.query(
      `SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC, check_in_time DESC`,
      [req.user.member_id]
    );

    // Calculate this month attendance & percentage
    const [[{ this_month }]] = await pool.query(
      `SELECT COUNT(*) AS this_month FROM attendance 
       WHERE member_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`,
      [req.user.member_id]
    );

    const currentDay = Math.max(1, new Date().getDate());
    const percentage = Math.min(100, Math.round((this_month / currentDay) * 100));

    res.json({
      success: true,
      count: attendance.length,
      thisMonth: this_month,
      percentage,
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record attendance / check-in
// @route   POST /api/attendance
// @access  Admin, Trainer, Member (self check-in)
const recordAttendance = async (req, res, next) => {
  try {
    let { member_id, date, check_in_time, check_out_time, status, notes } = req.body;

    if (req.user.role === 'member') {
      member_id = req.user.member_id;
    }

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    const recordDate = date || new Date().toISOString().split('T')[0];
    const recordCheckIn = check_in_time || new Date().toTimeString().split(' ')[0];

    // Check if attendance already recorded today for this member
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE member_id = ? AND date = ?',
      [member_id, recordDate]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this member on this date.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO attendance (member_id, date, check_in_time, check_out_time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [member_id, recordDate, recordCheckIn, check_out_time || null, status || 'present', notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully!',
      attendanceId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Member Check-out
// @route   PUT /api/attendance/:id/checkout
// @access  Admin, Trainer, Member
const checkOutAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkOutTime = req.body.check_out_time || new Date().toTimeString().split(' ')[0];

    await pool.query('UPDATE attendance SET check_out_time = ? WHERE id = ?', [checkOutTime, id]);

    res.json({ success: true, message: 'Check-out time recorded.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Admin
const deleteAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM attendance WHERE id = ?', [id]);
    res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAttendance,
  getMyAttendance,
  recordAttendance,
  checkOutAttendance,
  deleteAttendance
};
