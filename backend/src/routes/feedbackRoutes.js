const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback, getFeedbackStats } = require('../controllers/feedbackController');
const adminAuth = require('../middleware/adminAuth');

router.post('/', submitFeedback);
router.get('/', adminAuth, getFeedback);
router.get('/stats', adminAuth, getFeedbackStats);

module.exports = router;
