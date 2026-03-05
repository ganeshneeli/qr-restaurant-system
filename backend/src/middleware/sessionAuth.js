const jwt = require("jsonwebtoken")
const Session = require("../models/Session")

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ success: false, message: "No token" })

    // Decode JWT — contains sessionId, tableNumber, tableId
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verify session is still active in DB
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      active: true,
      expiresAt: { $gt: new Date() }
    })

    if (!session) return res.status(401).json({ success: false, message: "Session expired" })

    // Merge DB session with JWT payload so controllers have tableNumber + tableId
    req.session = {
      ...session.toObject(),
      tableNumber: decoded.tableNumber,  // from JWT
      tableId: decoded.tableId,      // from JWT (string id)
    }

    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" })
  }
}