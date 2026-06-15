const jwt = require("jsonwebtoken")
const User = require("../models/User")

/**
 * staffAuth(allowedRoles) — middleware factory
 * Usage: router.put("/route", staffAuth(["admin", "kitchen"]), handler)
 */
module.exports = (allowedRoles = ["admin"]) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ success: false, message: "No token provided" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" })
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Required role: ${allowedRoles.join(" or ")}` })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" })
  }
}
