const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  tableNumber: { type: Number, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  items: [{
    foodId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "preparing", "served", "completed"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  billRequested: { type: Boolean, default: false },
  specialNote: { type: String, default: "" }
}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)