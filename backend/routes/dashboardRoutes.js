const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard
} = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/admin', verifyToken, authorizeRoles('admin'), getAdminDashboard);
router.get('/trainer', verifyToken, authorizeRoles('trainer'), getTrainerDashboard);
router.get('/member', verifyToken, authorizeRoles('member'), getMemberDashboard);

module.exports = router;
