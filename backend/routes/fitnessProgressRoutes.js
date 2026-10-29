const express = require('express');
const router = express.Router();
const {
  getProgressByMember,
  createProgress,
  deleteProgress
} = require('../controllers/fitnessProgressController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/:memberId', verifyToken, getProgressByMember);
router.post('/', verifyToken, createProgress);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'trainer'), deleteProgress);

module.exports = router;
