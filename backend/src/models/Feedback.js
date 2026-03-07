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

feedbackSchema.index({ customer_rating: 1 });
feedbackSchema.index({ table_number: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
