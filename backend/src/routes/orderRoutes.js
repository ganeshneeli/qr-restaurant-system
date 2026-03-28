const router = require("express").Router()
const sessionAuth = require("../middleware/sessionAuth")
const adminAuth = require("../middleware/adminAuth")
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
    testMonthlyReport
} = require("../controllers/orderController")

router.get("/", adminAuth, getAllOrders)
router.get("/analytics", adminAuth, getAnalytics)
router.get("/summary/today", adminAuth, getDailySummary)

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
router.put("/:id/status", adminAuth, updateStatus)
router.put("/:id/pay", adminAuth, markAsPaid)

module.exports = router