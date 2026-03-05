const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const { activateTable, getActiveTables, getAllTables, getTableQR, forceReleaseTable } = require("../controllers/tableController")

router.post("/:tableNumber/activate", activateTable)
router.get("/active", adminAuth, getActiveTables)
router.get("/all", adminAuth, getAllTables)
router.get("/:tableNumber/qr", adminAuth, getTableQR)
router.post("/:tableNumber/release", adminAuth, forceReleaseTable)

module.exports = router