const Feedback = require('../models/Feedback');

// POST /api/feedback
const submitFeedback = async (req, res) => {
    try {
        const { order_id, table_number, customer_rating, customer_feedback_text } = req.body;

        if (!order_id || !table_number || !customer_rating) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newFeedback = new Feedback({
            order_id,
            table_number,
            customer_rating,
            customer_feedback_text: customer_feedback_text || '',
        });

        await newFeedback.save();

        return res.status(201).json({ success: true, data: newFeedback });
    } catch (error) {
        console.error('Submit feedback error:', error);
        return res.status(500).json({ success: false, message: 'Server error saving feedback' });
    }
};

// GET /api/feedback
const getFeedback = async (req, res) => {
    try {
        const { rating, page = 1, limit = 10 } = req.query;

        let query = {};
        if (rating) {
            query.customer_rating = Number(rating);
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Fetch paginated feedbacks
        const feedbacks = await Feedback.find(query)
            .populate('order_id', 'items totalAmount')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const totalCount = await Feedback.countDocuments(query);

        const responseData = {
            success: true,
            data: feedbacks,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / Number(limit)),
                currentPage: Number(page),
                limit: Number(limit)
            }
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Fetch feedback error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching feedback' });
    }
};


// GET /api/feedback/stats
const getFeedbackStats = async (req, res) => {
    try {
        const aggregations = await Feedback.aggregate([
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$customer_rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        let stats = { averageRating: 0, totalReviews: 0 };
        if (aggregations.length > 0) {
            stats = {
                averageRating: Number(aggregations[0].averageRating.toFixed(1)),
                totalReviews: aggregations[0].totalReviews
            };
        }

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Fetch feedback stats error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching feedback stats' });
    }
};

module.exports = {
    submitFeedback,
    getFeedback,
    getFeedbackStats
};
