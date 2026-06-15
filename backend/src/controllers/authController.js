const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// Admin login (existing — now includes role + name in token)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log(`Login attempt for: ${email}`)

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") } 
    })

    if (!user) {
      console.log(`User not found: ${email}`)
      return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Use staff login." })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      console.log(`Password mismatch for: ${email}`)
      return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    // Include role and name in token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name || "Admin" }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    )

    // Update last login
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

    console.log(`Login successful for: ${email}`)
    res.json({ success: true, token, role: user.role, name: user.name || "Admin" })
  } catch (error) {
    console.error(`Login error: ${error.message}`)
    res.status(500).json({ success: false, error: error.message })
  }
}

// Staff login — supports email+password OR PIN
exports.staffLogin = async (req, res) => {
  try {
    const { email, password, pin } = req.body

    let user = null

    if (pin && email) {
      // PIN-based login
      user = await User.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") },
        role: { $in: ["kitchen", "waiter"] }
      })

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
      }

      if (!user.pin) {
        return res.status(400).json({ success: false, message: "PIN not set for this account. Use password login." })
      }

      const pinMatch = await bcrypt.compare(pin, user.pin)
      if (!pinMatch) {
        return res.status(400).json({ success: false, message: "Invalid PIN" })
      }
    } else if (email && password) {
      // Password-based login
      user = await User.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, "i") },
        role: { $in: ["kitchen", "waiter"] }
      })

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
      }

      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return res.status(400).json({ success: false, message: "Invalid credentials" })
      }
    } else {
      return res.status(400).json({ success: false, message: "Email and password or PIN required" })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name || user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

    res.json({ success: true, token, role: user.role, name: user.name || user.email })
  } catch (error) {
    console.error(`Staff login error: ${error.message}`)
    res.status(500).json({ success: false, error: error.message })
  }
}