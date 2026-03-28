const router = require("express").Router()
const adminAuth = require("../middleware/adminAuth")
const upload = require("../middleware/upload")
const { body } = require("express-validator")
const validate = require("../middleware/validate")
const { getMenu, createMenu, toggleAvailability, updateMenu, deleteMenu, updateFlashSale } = require("../controllers/menuController")

router.get("/", getMenu)

const menuValidation = [
    body("name").notEmpty().withMessage("Name is required").trim(),
    body("price").isNumeric().withMessage("Price must be a number").custom(val => val > 0).withMessage("Price must be greater than 0"),
    body("category").notEmpty().withMessage("Category is required")
]

router.post("/", adminAuth, upload.single("imageFile"), menuValidation, validate, createMenu)
router.put("/:id", adminAuth, upload.single("imageFile"), menuValidation, validate, updateMenu)
router.put("/:id/toggle", adminAuth, toggleAvailability)
router.put("/:id/flash-sale", adminAuth, updateFlashSale)
router.delete("/:id", adminAuth, deleteMenu)


module.exports = router