const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  emails: [{ type: String }],
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["admin", "kitchen", "waiter"],
    default: "admin" 
  },
  name: { type: String, default: "" },
  pin: { type: String, default: null }, // hashed 4-digit PIN for kitchen/waiter
  lastLogin: { type: Date, default: null },
}, { timestamps: true })

// Hash PIN before saving if modified
// NOTE: In Mongoose 6+, async pre-save hooks must NOT accept `next` — the hook
// resolves automatically when the returned Promise resolves.
userSchema.pre("save", async function () {
  if (this.isModified("pin") && this.pin && this.pin.length === 4) {
    this.pin = await bcrypt.hash(this.pin, 10)
  }
})

module.exports = mongoose.model("User", userSchema)