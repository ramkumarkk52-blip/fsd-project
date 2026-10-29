const express = require('express');
const router = express.Router();
const {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  bookSchedule,
  deleteSchedule
} = require('../controllers/scheduleController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllSchedules);
router.get('/:id', verifyToken, getScheduleById);
router.post('/', verifyToken, authorizeRoles('admin', 'trainer'), createSchedule);
router.put('/:id', verifyToken, authorizeRoles('admin', 'trainer'), updateSchedule);
router.post('/:id/book', verifyToken, authorizeRoles('member'), bookSchedule);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'trainer'), deleteSchedule);

module.exports = router;
