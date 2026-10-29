const express = require('express');
const router = express.Router();
const {
  getAllWorkoutPlans,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan
} = require('../controllers/workoutPlanController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllWorkoutPlans);
router.get('/:id', verifyToken, getWorkoutPlanById);
router.post('/', verifyToken, authorizeRoles('admin', 'trainer'), createWorkoutPlan);
router.put('/:id', verifyToken, authorizeRoles('admin', 'trainer'), updateWorkoutPlan);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'trainer'), deleteWorkoutPlan);

module.exports = router;
