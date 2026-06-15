const router = require("express").Router()
const { login, staffLogin } = require("../controllers/authController")
const { getAllStaff, createStaff, deleteStaff, updateStaffPin } = require("../controllers/staffController")
const adminAuth = require("../middleware/adminAuth")

const rateLimit = require("express-rate-limit")

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { success: false, message: "Too many login attempts, please try again after an hour" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Existing admin login
router.post("/login", loginLimiter, login)

// New staff login (kitchen/waiter)
router.post("/staff-login", loginLimiter, staffLogin)

// Admin-only staff management
router.get("/staff", adminAuth, getAllStaff)
router.post("/staff", adminAuth, createStaff)
router.delete("/staff/:id", adminAuth, deleteStaff)
router.patch("/staff/:id/pin", adminAuth, updateStaffPin)

module.exports = router