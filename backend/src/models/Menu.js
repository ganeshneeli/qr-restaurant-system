const mongoose = require("mongoose")

const menuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: String, default: "Other" },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true },
  order_count: { type: Number, default: 0 },
  isChefSpecial: { type: Boolean, default: false }
}, { timestamps: true })

menuSchema.index({ category: 1 });
menuSchema.index({ available: 1 });
menuSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Menu", menuSchema)