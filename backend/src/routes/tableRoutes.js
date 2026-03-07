const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const {
    activateTable,
    getActiveTables,
    getAllTables,
    getTableQR,
    forceReleaseTable,
    addTable,
    removeTable
} = require("../controllers/tableController")

router.post("/:tableNumber/activate", activateTable)
router.get("/active", adminAuth, getActiveTables)
router.get("/all", adminAuth, getAllTables)
router.get("/:tableNumber/qr", adminAuth, getTableQR)
router.post("/:tableNumber/release", adminAuth, forceReleaseTable)
router.post("/", adminAuth, addTable)
router.delete("/:tableNumber", adminAuth, removeTable)

module.exports = router