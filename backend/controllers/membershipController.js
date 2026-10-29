const pool = require('../config/db');

// @desc    Get all membership plans
// @route   GET /api/memberships
// @access  Public
const getAllMemberships = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT m.*,
             (SELECT COUNT(*) FROM members WHERE membership_id = m.id) AS active_members_count
      FROM memberships m
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY m.price ASC`;

    const [memberships] = await pool.query(query, params);

    // Parse features if stored as JSON string
    const formatted = memberships.map(m => {
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof m.features === 'string' ? JSON.parse(m.features) : m.features;
      } catch (e) {
        parsedFeatures = m.features ? m.features.split(',').map(s => s.trim()) : [];
      }
      return { ...m, features: parsedFeatures };
    });

    res.json({
      success: true,
      count: formatted.length,
      memberships: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get membership plan by ID
// @route   GET /api/memberships/:id
// @access  Public
const getMembershipById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM memberships WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Membership plan not found.' });
    }

    const plan = rows[0];
    try {
      plan.features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
    } catch (e) {
      plan.features = plan.features ? plan.features.split(',').map(s => s.trim()) : [];
    }

    res.json({ success: true, membership: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new membership plan
// @route   POST /api/memberships
// @access  Admin
const createMembership = async (req, res, next) => {
  try {
    const { name, description, duration_months, price, features, status } = req.body;

    if (!name || !duration_months || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, duration, and price are required.' });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : (typeof features === 'string' ? JSON.stringify(features.split(',').map(f => f.trim())) : JSON.stringify([]));

    const [result] = await pool.query(
      `INSERT INTO memberships (name, description, duration_months, price, features, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), description || null, parseInt(duration_months), parseFloat(price), featuresJson, status || 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully!',
      planId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update membership plan
// @route   PUT /api/memberships/:id
// @access  Admin
const updateMembership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, duration_months, price, features, status } = req.body;

    const featuresJson = features !== undefined
      ? (Array.isArray(features) ? JSON.stringify(features) : JSON.stringify(features.split(',').map(f => f.trim())))
      : null;

    await pool.query(
      `UPDATE memberships SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        duration_months = COALESCE(?, duration_months),
        price = COALESCE(?, price),
        features = COALESCE(?, features),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [name, description, duration_months ? parseInt(duration_months) : null, price !== undefined ? parseFloat(price) : null, featuresJson, status, id]
    );

    res.json({ success: true, message: 'Membership plan updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete membership plan
// @route   DELETE /api/memberships/:id
// @access  Admin
const deleteMembership = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if any member is currently assigned to this plan
    const [members] = await pool.query('SELECT id FROM members WHERE membership_id = ?', [id]);
    if (members.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. It is actively linked to ${members.length} member(s). You can set its status to inactive instead.`
      });
    }

    await pool.query('DELETE FROM memberships WHERE id = ?', [id]);

    res.json({ success: true, message: 'Membership plan deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership
};
