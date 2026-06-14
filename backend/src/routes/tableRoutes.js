const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const sessionAuth = require("../middleware/sessionAuth")
const { activateTable, getActiveTables, getAllTables, getTableQR, getAllTableQRs, forceReleaseTable, addTable, removeTable, exitTable } = require("../controllers/tableController")

router.post("/:tableNumber/activate", activateTable)
router.post("/exit", sessionAuth, exitTable)
router.get("/active", adminAuth, getActiveTables)
router.get("/all", adminAuth, getAllTables)
router.get("/qrs", adminAuth, getAllTableQRs)
router.get("/:tableNumber/qr", adminAuth, getTableQR)
router.post("/:tableNumber/release", adminAuth, forceReleaseTable)
router.post("/add", adminAuth, addTable)
router.delete("/:tableNumber", adminAuth, removeTable)

module.exports = router