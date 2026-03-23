const jwt = require("jsonwebtoken")
const User = require("../models/User")

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ success: false, message: "No token provided" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("role email").lean()

    if (!user || user.role !== "admin")
      return res.status(403).json({ success: false, message: "Unauthorized access" })

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" })
  }
}