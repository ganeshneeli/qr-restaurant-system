const router = require("express").Router()
const sessionAuth = require("../middleware/sessionAuth")
const adminAuth = require("../middleware/adminAuth")
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
router.get("/test-monthly-report", testMonthlyReport)

router.get("/my", sessionAuth, getMyOrder)
router.put("/request-bill", sessionAuth, requestBill)
router.post("/", sessionAuth, createOrder)
router.put("/:id/status", adminAuth, updateStatus)
router.put("/:id/pay", adminAuth, markAsPaid)

module.exports = router