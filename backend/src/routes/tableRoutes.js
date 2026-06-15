const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const sessionAuth = require("../middleware/sessionAuth")
const staffAuth = require("../middleware/staffAuth")
const { activateTable, getActiveTables, getAllTables, getTableQR, getAllTableQRs, forceReleaseTable, addTable, removeTable, exitTable } = require("../controllers/tableController")

router.post("/:tableNumber/activate", activateTable)
router.post("/exit", sessionAuth, exitTable)
router.get("/active", staffAuth(["admin", "waiter", "kitchen"]), getActiveTables)
router.get("/all", staffAuth(["admin", "waiter", "kitchen"]), getAllTables)
router.get("/qrs", adminAuth, getAllTableQRs)
router.get("/:tableNumber/qr", adminAuth, getTableQR)
router.post("/:tableNumber/release", staffAuth(["admin", "waiter"]), forceReleaseTable)
router.post("/add", adminAuth, addTable)
router.delete("/:tableNumber", adminAuth, removeTable)

module.exports = router