const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitness_center_super_secret_jwt_key_2026_!@#$');

    // Fetch user with trainer_id or member_id if applicable
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.avatar_url,
              t.id AS trainer_id,
              m.id AS member_id
       FROM users u
       LEFT JOIN trainers t ON u.id = t.user_id
       LEFT JOIN members m ON u.id = m.user_id
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token or inactive user account.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
