const pool = require('../config/db');

// @desc    Get Admin Dashboard Stats & Analytics
// @route   GET /api/dashboard/admin
// @access  Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    // 1. Overall counts
    const [[{ total_members }]] = await pool.query('SELECT COUNT(*) AS total_members FROM members');
    const [[{ active_members }]] = await pool.query("SELECT COUNT(*) AS active_members FROM members WHERE status = 'active'");
    const [[{ total_trainers }]] = await pool.query('SELECT COUNT(*) AS total_trainers FROM trainers');
    const [[{ total_plans }]] = await pool.query("SELECT COUNT(*) AS total_plans FROM memberships WHERE status = 'active'");

    // 2. Active & Expired Memberships
    // Active: Subscriptions marked 'active' and end_date >= CURDATE()
    const [[{ active_memberships }]] = await pool.query(
      `SELECT COUNT(*) AS active_memberships FROM subscriptions 
       WHERE status = 'active' AND end_date >= CURDATE()`
    );

    // Expired: Subscriptions marked 'expired' OR where end_date < CURDATE()
    const [[{ expired_memberships }]] = await pool.query(
      `SELECT COUNT(*) AS expired_memberships FROM subscriptions 
       WHERE status = 'expired' OR (status = 'active' AND end_date < CURDATE())`
    );

    // 3. Subscriptions expiring within 30 days
    const [[{ expiring_soon }]] = await pool.query(
      `SELECT COUNT(*) AS expiring_soon FROM subscriptions
       WHERE status = 'active' AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );

    // 4. Revenue: Total & Current Month Revenue
    const [[{ total_revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(amount_paid), 0) AS total_revenue FROM subscriptions WHERE payment_status = 'paid'"
    );

    const [[{ monthly_revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS monthly_revenue FROM subscriptions 
       WHERE payment_status = 'paid' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
    );

    // 5. Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const [[{ today_attendance }]] = await pool.query(
      'SELECT COUNT(*) AS today_attendance FROM attendance WHERE date = ?',
      [today]
    );

    // 6. Monthly Revenue Trend (Last 6 Months)
    const [revenueTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS month_label,
              DATE_FORMAT(created_at, '%Y-%m') AS month_key,
              COALESCE(SUM(amount_paid), 0) AS revenue
       FROM subscriptions
       WHERE payment_status = 'paid'
       GROUP BY month_key, month_label
       ORDER BY month_key ASC
       LIMIT 6`
    );

    // 7. Membership Distribution
    const [membershipDistribution] = await pool.query(
      `SELECT mem.name AS plan_name, COUNT(m.id) AS member_count
       FROM memberships mem
       LEFT JOIN members m ON mem.id = m.membership_id
       GROUP BY mem.id, mem.name
       ORDER BY member_count DESC`
    );

    // 8. Recent Members
    const [recentMembers] = await pool.query(
      `SELECT m.id, u.name, u.email, u.phone, m.join_date, m.status, mem.name AS membership_name
       FROM members m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       ORDER BY m.created_at DESC
       LIMIT 5`
    );

    // 9. Recent Attendance
    const [recentAttendance] = await pool.query(
      `SELECT a.id, a.date, a.check_in_time, a.status, u.name AS member_name, mem.name AS membership_name
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       ORDER BY a.date DESC, a.check_in_time DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalMembers: total_members,
        activeMembers: active_members,
        totalTrainers: total_trainers,
        totalPlans: total_plans,
        activeMemberships: active_memberships,
        expiredMemberships: expired_memberships,
        todayAttendance: today_attendance,
        monthlyRevenue: parseFloat(monthly_revenue),
        totalRevenue: parseFloat(total_revenue),
        expiringSoon: expiring_soon
      },
      charts: {
        revenueTrend,
        membershipDistribution
      },
      recentMembers,
      recentAttendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Trainer Dashboard Stats & Schedule
// @route   GET /api/dashboard/trainer
// @access  Trainer
const getTrainerDashboard = async (req, res, next) => {
  try {
    const trainerId = req.user.trainer_id;
    if (!trainerId) {
      return res.status(400).json({ success: false, message: 'Current user has no associated trainer profile.' });
    }

    // 1. Stats
    const [[{ assigned_members }]] = await pool.query(
      'SELECT COUNT(*) AS assigned_members FROM members WHERE trainer_id = ?',
      [trainerId]
    );

    const [[{ active_workout_plans }]] = await pool.query(
      "SELECT COUNT(*) AS active_workout_plans FROM workout_plans WHERE trainer_id = ? AND status = 'active'",
      [trainerId]
    );

    const today = new Date().toISOString().split('T')[0];
    const [[{ sessions_today }]] = await pool.query(
      'SELECT COUNT(*) AS sessions_today FROM schedules WHERE trainer_id = ? AND session_date = ?',
      [trainerId, today]
    );

    // 2. Upcoming Sessions
    const [upcomingSessions] = await pool.query(
      `SELECT s.*, u.name AS member_name, u.phone AS member_phone
       FROM schedules s
       LEFT JOIN members m ON s.member_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       WHERE s.trainer_id = ? AND s.session_date >= CURDATE()
       ORDER BY s.session_date ASC, s.start_time ASC
       LIMIT 5`,
      [trainerId]
    );

    // 3. Assigned Members List
    const [members] = await pool.query(
      `SELECT m.id, u.name, u.email, u.phone, m.gender, m.status, mem.name AS membership_name
       FROM members m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       WHERE m.trainer_id = ?
       ORDER BY u.name ASC`,
      [trainerId]
    );

    // 4. Recent Fitness Progress Logged
    const [recentProgress] = await pool.query(
      `SELECT p.*, u.name AS member_name
       FROM fitness_progress p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE m.trainer_id = ?
       ORDER BY p.date DESC
       LIMIT 5`,
      [trainerId]
    );

    res.json({
      success: true,
      stats: {
        assignedMembers: assigned_members,
        activeWorkoutPlans: active_workout_plans,
        sessionsToday: sessions_today
      },
      upcomingSessions,
      members,
      recentProgress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Member Dashboard Details
// @route   GET /api/dashboard/member
// @access  Member
const getMemberDashboard = async (req, res, next) => {
  try {
    const memberId = req.user.member_id;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Current user has no associated member profile.' });
    }

    // 1. Member profile & membership info
    const [members] = await pool.query(
      `SELECT m.id, m.join_date, m.status,
              mem.id AS membership_id, mem.name AS membership_name, mem.price AS membership_price, mem.features,
              t.id AS trainer_id, tu.name AS trainer_name, tu.email AS trainer_email, tu.phone AS trainer_phone, t.specialization AS trainer_specialization
       FROM members m
       LEFT JOIN memberships mem ON m.membership_id = mem.id
       LEFT JOIN trainers t ON m.trainer_id = t.id
       LEFT JOIN users tu ON t.user_id = tu.id
       WHERE m.id = ?`,
      [memberId]
    );

    const memberInfo = members[0] || {};

    // 2. Active Subscription & Expiry
    const [subscriptions] = await pool.query(
      `SELECT s.*, mem.name AS membership_name,
              DATEDIFF(s.end_date, CURDATE()) AS days_left
       FROM subscriptions s
       JOIN memberships mem ON s.membership_id = mem.id
       WHERE s.member_id = ?
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [memberId]
    );

    const activeSubscription = subscriptions[0] || null;

    // 3. Active Workout Plan
    const [workoutPlans] = await pool.query(
      `SELECT w.*, tu.name AS trainer_name
       FROM workout_plans w
       JOIN trainers t ON w.trainer_id = t.id
       JOIN users tu ON t.user_id = tu.id
       WHERE w.member_id = ? AND w.status = 'active'
       ORDER BY w.created_at DESC
       LIMIT 1`,
      [memberId]
    );

    let activeWorkoutPlan = workoutPlans[0] || null;
    if (activeWorkoutPlan && activeWorkoutPlan.exercises) {
      try {
        activeWorkoutPlan.exercises = typeof activeWorkoutPlan.exercises === 'string'
          ? JSON.parse(activeWorkoutPlan.exercises)
          : activeWorkoutPlan.exercises;
      } catch (e) {
        activeWorkoutPlan.exercises = [];
      }
    }

    // 4. Attendance Stats & Percentage Calculation
    const [[{ total_attendance }]] = await pool.query(
      'SELECT COUNT(*) AS total_attendance FROM attendance WHERE member_id = ?',
      [memberId]
    );

    const [[{ month_attendance }]] = await pool.query(
      `SELECT COUNT(*) AS month_attendance FROM attendance
       WHERE member_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`,
      [memberId]
    );

    // Calculate attendance percentage: monthly target of 24 workout days, or elapsed days of current month
    const currentDayOfMonth = Math.max(1, new Date().getDate());
    const attendancePercentage = Math.min(100, Math.round((month_attendance / currentDayOfMonth) * 100));

    const [recentAttendance] = await pool.query(
      'SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC, check_in_time DESC LIMIT 5',
      [memberId]
    );

    // 5. Fitness Progress Timeline & Latest Stats
    const [progressHistory] = await pool.query(
      'SELECT * FROM fitness_progress WHERE member_id = ? ORDER BY date ASC',
      [memberId]
    );

    const latestProgress = progressHistory.length > 0 ? progressHistory[progressHistory.length - 1] : null;
    const initialProgress = progressHistory.length > 0 ? progressHistory[0] : null;

    // 6. Upcoming Scheduled Sessions
    const [upcomingSessions] = await pool.query(
      `SELECT s.*, u.name AS trainer_name
       FROM schedules s
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE (s.member_id = ? OR s.session_type = 'group_class') AND s.session_date >= CURDATE()
       ORDER BY s.session_date ASC, s.start_time ASC
       LIMIT 5`,
      [memberId]
    );

    res.json({
      success: true,
      memberInfo,
      activeSubscription,
      activeWorkoutPlan,
      attendanceStats: {
        total: total_attendance,
        thisMonth: month_attendance,
        percentage: attendancePercentage,
        recent: recentAttendance
      },
      fitnessStats: {
        latest: latestProgress,
        initial: initialProgress,
        history: progressHistory
      },
      upcomingSessions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard
};
