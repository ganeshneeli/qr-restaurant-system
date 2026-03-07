const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  emails: [{ type: String }],
  password: { type: String, required: true },
  role: { type: String, default: "admin" }
})

module.exports = mongoose.model("User", userSchema)