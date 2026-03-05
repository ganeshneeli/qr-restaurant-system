const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  active: { type: Boolean, default: true },
  startedAt: Date,
  expiresAt: Date
})

module.exports = mongoose.model("Session", sessionSchema)