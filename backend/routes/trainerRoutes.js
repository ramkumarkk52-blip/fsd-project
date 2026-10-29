const express = require('express');
const router = express.Router();
const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  assignTrainerToMembers,
  deleteTrainer
} = require('../controllers/trainerController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', getAllTrainers);
router.get('/:id', verifyToken, getTrainerById);
router.post('/', verifyToken, authorizeRoles('admin'), createTrainer);
router.put('/:id', verifyToken, authorizeRoles('admin', 'trainer'), updateTrainer);
router.post('/:id/assign', verifyToken, authorizeRoles('admin'), assignTrainerToMembers);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteTrainer);

module.exports = router;
