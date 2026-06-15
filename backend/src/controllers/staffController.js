const User = require("../models/User")
const bcrypt = require("bcrypt")

// Admin: Get all staff (waiter + kitchen roles)
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find(
      { role: { $in: ["kitchen", "waiter"] } },
      { password: 0, pin: 0 } // never return sensitive fields
    ).sort({ createdAt: -1 })
    res.json({ success: true, data: staff })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Create a new staff member
exports.createStaff = async (req, res) => {
  try {
    const { email, password, name, role, pin } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: "email, password, name, role are required" })
    }

    if (!["kitchen", "waiter"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'kitchen' or 'waiter'" })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const staffData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
      role,
    }

    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
      staffData.pin = pin // will be hashed by pre-save hook
    }

    const staff = new User(staffData)
    await staff.save()

    res.status(201).json({
      success: true,
      data: { _id: staff._id, email: staff.email, name: staff.name, role: staff.role }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Delete a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id)
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" })
    }
    if (staff.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot delete admin accounts" })
    }
    await User.deleteOne({ _id: req.params.id })
    res.json({ success: true, message: "Staff removed" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Update staff PIN
exports.updateStaffPin = async (req, res) => {
  try {
    const { pin } = req.body
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "PIN must be exactly 4 digits" })
    }
    const staff = await User.findById(req.params.id)
    if (!staff || staff.role === "admin") {
      return res.status(404).json({ success: false, message: "Staff not found" })
    }
    staff.pin = pin // will be hashed by pre-save hook
    await staff.save()
    res.json({ success: true, message: "PIN updated" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
