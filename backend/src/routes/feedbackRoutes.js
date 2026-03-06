const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback, getFeedbackStats } = require('../controllers/feedbackController');

router.post('/', submitFeedback);
router.get('/', getFeedback);
router.get('/stats', getFeedbackStats);

module.exports = router;
