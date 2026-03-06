const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    table_number: {
        type: String,
        required: true,
    },
    customer_rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    customer_feedback_text: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: 'completed',
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
