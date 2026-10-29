const express = require('express');
const router = express.Router();
const {
  getAllSubscriptions,
  getMySubscriptions,
  createSubscription,
  updateSubscription
} = require('../controllers/subscriptionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles('admin'), getAllSubscriptions);
router.get('/my', verifyToken, authorizeRoles('member'), getMySubscriptions);
router.post('/', verifyToken, createSubscription);
router.put('/:id', verifyToken, authorizeRoles('admin'), updateSubscription);

module.exports = router;
