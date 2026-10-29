const express = require('express');
const router = express.Router();
const {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership
} = require('../controllers/membershipController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public can view memberships
router.get('/', getAllMemberships);
router.get('/:id', getMembershipById);
router.post('/', verifyToken, authorizeRoles('admin'), createMembership);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateMembership);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteMembership);

module.exports = router;
