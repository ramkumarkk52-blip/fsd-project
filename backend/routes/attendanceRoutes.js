const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getMyAttendance,
  recordAttendance,
  checkOutAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles('admin', 'trainer'), getAllAttendance);
router.get('/my', verifyToken, authorizeRoles('member'), getMyAttendance);
router.post('/', verifyToken, recordAttendance);
router.put('/:id/checkout', verifyToken, checkOutAttendance);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteAttendance);

module.exports = router;
