const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

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

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      console.log(`Password mismatch for: ${email}`)
      return res.status(400).json({ success: false, message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    console.log(`Login successful for: ${email}`)

    res.json({ success: true, token })
  } catch (error) {
    console.error(`Login error: ${error.message}`)
    res.status(500).json({ success: false, error: error.message })
  }
}