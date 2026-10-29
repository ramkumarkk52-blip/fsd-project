const pool = require('../config/db');

// @desc    Get all workout plans
// @route   GET /api/workout-plans
// @access  Admin, Trainer, Member
const getAllWorkoutPlans = async (req, res, next) => {
  try {
    const { member_id, trainer_id, status } = req.query;

    let query = `
      SELECT w.*,
             u_m.name AS member_name, u_m.email AS member_email,
             u_t.name AS trainer_name, t.specialization AS trainer_specialization
      FROM workout_plans w
      JOIN members m ON w.member_id = m.id
      JOIN users u_m ON m.user_id = u_m.id
      JOIN trainers t ON w.trainer_id = t.id
      JOIN users u_t ON t.user_id = u_t.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based scoping
    if (req.user.role === 'member') {
      query += ` AND w.member_id = ?`;
      params.push(req.user.member_id);
    } else if (req.user.role === 'trainer') {
      query += ` AND w.trainer_id = ?`;
      params.push(req.user.trainer_id);
    }

    if (member_id && req.user.role !== 'member') {
      query += ` AND w.member_id = ?`;
      params.push(member_id);
    }

    if (trainer_id && req.user.role === 'admin') {
      query += ` AND w.trainer_id = ?`;
      params.push(trainer_id);
    }

    if (status) {
      query += ` AND w.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY w.created_at DESC`;

    const [plans] = await pool.query(query, params);

    const formatted = plans.map(p => {
      let exercises = [];
      try {
        exercises = typeof p.exercises === 'string' ? JSON.parse(p.exercises) : p.exercises;
      } catch (e) {
        exercises = [];
      }
      return { ...p, exercises };
    });

    res.json({
      success: true,
      count: formatted.length,
      workoutPlans: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout plan by ID
// @route   GET /api/workout-plans/:id
// @access  Admin, Trainer, Member
const getWorkoutPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [plans] = await pool.query(
      `SELECT w.*,
              u_m.name AS member_name, u_m.email AS member_email,
              u_t.name AS trainer_name, t.specialization AS trainer_specialization
       FROM workout_plans w
       JOIN members m ON w.member_id = m.id
       JOIN users u_m ON m.user_id = u_m.id
       JOIN trainers t ON w.trainer_id = t.id
       JOIN users u_t ON t.user_id = u_t.id
       WHERE w.id = ?`,
      [id]
    );

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }

    const plan = plans[0];

    // Authorization check
    if (req.user.role === 'member' && plan.member_id !== req.user.member_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. This workout plan is not assigned to you.' });
    }

    if (req.user.role === 'trainer' && plan.trainer_id !== req.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You are not the trainer for this plan.' });
    }

    try {
      plan.exercises = typeof plan.exercises === 'string' ? JSON.parse(plan.exercises) : plan.exercises;
    } catch (e) {
      plan.exercises = [];
    }

    res.json({
      success: true,
      workoutPlan: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create workout plan
// @route   POST /api/workout-plans
// @access  Admin, Trainer
const createWorkoutPlan = async (req, res, next) => {
  try {
    let { title, description, member_id, trainer_id, goal, difficulty, schedule_days, exercises, start_date, end_date, status } = req.body;

    if (req.user.role === 'trainer') {
      trainer_id = req.user.trainer_id;
    }

    if (!title || !member_id || !trainer_id || !goal) {
      return res.status(400).json({ success: false, message: 'Title, member, trainer, and goal are required.' });
    }

    const exercisesJson = Array.isArray(exercises) ? JSON.stringify(exercises) : (typeof exercises === 'string' ? exercises : JSON.stringify([]));

    const [result] = await pool.query(
      `INSERT INTO workout_plans (title, description, member_id, trainer_id, goal, difficulty, schedule_days, exercises, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || null,
        member_id,
        trainer_id,
        goal,
        difficulty || 'beginner',
        schedule_days || 'Mon, Wed, Fri',
        exercisesJson,
        start_date || new Date().toISOString().split('T')[0],
        end_date || null,
        status || 'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Workout plan created successfully!',
      planId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workout plan
// @route   PUT /api/workout-plans/:id
// @access  Admin, Trainer
const updateWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, goal, difficulty, schedule_days, exercises, start_date, end_date, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM workout_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }

    if (req.user.role === 'trainer' && existing[0].trainer_id !== req.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You did not author this workout plan.' });
    }

    const exercisesJson = exercises !== undefined
      ? (Array.isArray(exercises) ? JSON.stringify(exercises) : exercises)
      : null;

    await pool.query(
      `UPDATE workout_plans SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        goal = COALESCE(?, goal),
        difficulty = COALESCE(?, difficulty),
        schedule_days = COALESCE(?, schedule_days),
        exercises = COALESCE(?, exercises),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [title, description, goal, difficulty, schedule_days, exercisesJson, start_date, end_date, status, id]
    );

    res.json({ success: true, message: 'Workout plan updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workout plan
// @route   DELETE /api/workout-plans/:id
// @access  Admin, Trainer
const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM workout_plans WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }

    if (req.user.role === 'trainer' && existing[0].trainer_id !== req.user.trainer_id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You did not author this workout plan.' });
    }

    await pool.query('DELETE FROM workout_plans WHERE id = ?', [id]);

    res.json({ success: true, message: 'Workout plan deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan
};
