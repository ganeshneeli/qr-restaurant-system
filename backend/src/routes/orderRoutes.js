const router = require("express").Router()
const sessionAuth = require("../middleware/sessionAuth")
const adminAuth = require("../middleware/adminAuth")
const staffAuth = require("../middleware/staffAuth")
const { body } = require("express-validator")
const validate = require("../middleware/validate")
const {
    createOrder,
    updateStatus,
    getAllOrders,
    getDailySummary,
    requestBill,
    getMyOrder,
    markAsPaid,
    getAnalytics,
    getKitchenOrders,
    getWaiterOrders,
} = require("../controllers/orderController")

// Admin routes
router.get("/", adminAuth, getAllOrders)
router.get("/analytics", adminAuth, getAnalytics)
router.get("/summary/today", adminAuth, getDailySummary)
router.put("/:id/pay", adminAuth, markAsPaid)

// Kitchen & Waiter routes (staff can update order status)
router.get("/kitchen", staffAuth(["kitchen", "admin"]), getKitchenOrders)
router.get("/waiter", staffAuth(["waiter", "admin"]), getWaiterOrders)
router.put("/:id/status", staffAuth(["admin", "kitchen", "waiter"]), updateStatus)

// Customer routes
router.get("/my", sessionAuth, getMyOrder)
router.put("/request-bill", sessionAuth, requestBill)
router.post("/", 
    sessionAuth, 
    [
        body("items").isArray({ min: 1 }).withMessage("Items must be a non-empty array"),
        body("items.*.foodId").isMongoId().withMessage("Invalid foodId"),
        body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1")
    ],
    validate,
    createOrder
)

module.exports = router