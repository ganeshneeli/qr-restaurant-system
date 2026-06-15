const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  tableNumber: { type: Number, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  items: [{
    foodId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    station: { type: String, enum: ["grill", "fry", "drinks", "dessert", "general"], default: "general" }
  }],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "accepted", "cooking", "plating", "ready", "served", "completed"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  billRequested: { type: Boolean, default: false },
  specialNote: { type: String, default: "" },
  priority: { type: Number, default: 0 }, // higher = more urgent
  kitchenAcceptedAt: { type: Date, default: null }, // for accurate timer tracking
  tableSize: { type: Number, default: 1 }, // for priority scoring
}, { timestamps: true })

orderSchema.index({ "items.foodId": 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema)