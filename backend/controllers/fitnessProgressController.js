const pool = require('../config/db');

// @desc    Get fitness progress history for a member
// @route   GET /api/progress/:memberId
// @access  Authenticated
const getProgressByMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    // Authorization
    if (req.user.role === 'member' && req.user.member_id != memberId) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own fitness progress.' });
    }

    const [progress] = await pool.query(
      `SELECT p.*, u.name AS recorded_by_name
       FROM fitness_progress p
       JOIN users u ON p.recorded_by = u.id
       WHERE p.member_id = ?
       ORDER BY p.date ASC`,
      [memberId]
    );

    // Also get member details
    const [members] = await pool.query(
      `SELECT m.id, u.name, m.gender, m.dob
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [memberId]
    );

    res.json({
      success: true,
      member: members[0] || null,
      count: progress.length,
      progress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new fitness progress entry
// @route   POST /api/progress
// @access  Trainer, Member, Admin
const createProgress = async (req, res, next) => {
  try {
    let { member_id, date, weight_kg, height_cm, body_fat_percentage, chest_cm, waist_cm, arms_cm, notes } = req.body;

    if (req.user.role === 'member') {
      member_id = req.user.member_id;
    }

    if (!member_id || !weight_kg) {
      return res.status(400).json({ success: false, message: 'Member ID and weight are required.' });
    }

    const recordDate = date || new Date().toISOString().split('T')[0];

    // Calculate BMI if height is available
    let bmi = null;
    if (height_cm && weight_kg) {
      const heightInMeters = parseFloat(height_cm) / 100;
      bmi = parseFloat((parseFloat(weight_kg) / (heightInMeters * heightInMeters)).toFixed(2));
    }

    const [result] = await pool.query(
      `INSERT INTO fitness_progress (member_id, recorded_by, date, weight_kg, height_cm, bmi, body_fat_percentage, chest_cm, waist_cm, arms_cm, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member_id,
        req.user.id,
        recordDate,
        parseFloat(weight_kg),
        height_cm ? parseFloat(height_cm) : null,
        bmi,
        body_fat_percentage ? parseFloat(body_fat_percentage) : null,
        chest_cm ? parseFloat(chest_cm) : null,
        waist_cm ? parseFloat(waist_cm) : null,
        arms_cm ? parseFloat(arms_cm) : null,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Fitness progress logged successfully!',
      progressId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete progress entry
// @route   DELETE /api/progress/:id
// @access  Trainer, Admin
const deleteProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fitness_progress WHERE id = ?', [id]);
    res.json({ success: true, message: 'Progress record deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProgressByMember,
  createProgress,
  deleteProgress
};
