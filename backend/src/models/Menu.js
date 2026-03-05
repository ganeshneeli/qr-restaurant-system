const mongoose = require("mongoose")

const menuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: String, default: "Other" },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true }
})

module.exports = mongoose.model("Menu", menuSchema)