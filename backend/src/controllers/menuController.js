const Menu = require("../models/Menu")
const { getIO } = require("../config/socket")

exports.getMenu = async (req, res) => {
  const items = await Menu.find({})
  res.json({ success: true, data: items })
}

exports.createMenu = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    // Handle numeric fields if sent as strings via FormData
    if (data.price) data.price = Number(data.price);

    const item = await Menu.create(data);
    getIO().emit("menuUpdate", { type: "create", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  const item = await Menu.findById(req.params.id)
  item.available = !item.available
  await item.save()
  getIO().emit("menuUpdate", { type: "toggle", item })
  res.json({ success: true, data: item })
}

exports.updateMenu = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    if (data.price) data.price = Number(data.price);

    const item = await Menu.findByIdAndUpdate(req.params.id, data, { new: true });
    getIO().emit("menuUpdate", { type: "update", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id)
  getIO().emit("menuUpdate", { type: "delete", id: req.params.id })
  res.json({ success: true, message: "Item deleted" })
}