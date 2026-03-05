const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const upload = require("../middleware/upload")
const { getMenu, createMenu, toggleAvailability, updateMenu, deleteMenu } = require("../controllers/menuController")

router.get("/", getMenu)
router.post("/", adminAuth, upload.single("imageFile"), createMenu)
router.put("/:id", adminAuth, upload.single("imageFile"), updateMenu)
router.put("/:id/toggle", adminAuth, toggleAvailability)
router.delete("/:id", adminAuth, deleteMenu)

module.exports = router