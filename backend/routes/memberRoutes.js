const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles('admin', 'trainer'), getAllMembers);
router.get('/:id', verifyToken, getMemberById);
router.post('/', verifyToken, authorizeRoles('admin'), createMember);
router.put('/:id', verifyToken, authorizeRoles('admin', 'trainer'), updateMember);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteMember);

module.exports = router;
