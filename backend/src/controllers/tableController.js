const Table = require("../models/Table")
const Session = require("../models/Session")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")
const QRCode = require("qrcode")
const { getIO } = require("../config/socket")

exports.activateTable = async (req, res) => {
  const sessionId = uuidv4()
  const table = await Table.findOneAndUpdate(
    { tableNumber: req.params.tableNumber, status: "available" },
    { status: "occupied", currentSessionId: sessionId, startedAt: new Date() },
    { new: true }
  )

  if (!table)
    return res.status(400).json({ success: false, message: "Table occupied" })

  await Session.create({
    sessionId,
    tableId: table._id,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
  })

  const token = jwt.sign(
    { sessionId, tableNumber: table.tableNumber, tableId: table._id },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  )

  try { getIO().to("admin").emit("tableUpdated"); } catch (e) { }

  res.json({ success: true, token })
}

exports.getActiveTables = async (req, res) => {
  try {
    const tables = await Table.find({ status: "occupied" })
    const formattedTables = tables.map(t => ({
      ...t.toObject(),
      number: t.tableNumber,
      activatedAt: t.startedAt
    }))
    res.json({ success: true, data: formattedTables })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 })
    const formattedTables = tables.map(t => ({
      ...t.toObject(),
      number: t.tableNumber,
      activatedAt: t.startedAt
    }))
    res.json({ success: true, data: formattedTables })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getTableQR = async (req, res) => {
  try {
    const { tableNumber } = req.params
    const frontendBaseUrl = process.env.FRONTEND_URL || "https://qr-restaurant-system-2.onrender.com"
    const url = `${frontendBaseUrl}/table/${tableNumber}`
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" }
    })
    res.json({ success: true, qr: qrDataUrl, url, tableNumber: Number(tableNumber) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.forceReleaseTable = async (req, res) => {
  try {
    const { tableNumber } = req.params
    const table = await Table.findOneAndUpdate(
      { tableNumber },
      { status: "available", currentSessionId: null, startedAt: null },
      { new: true }
    )

    if (!table) return res.status(404).json({ success: false, message: "Table not found" })

    // If there was a session, deactivate it
    if (table.currentSessionId) {
      await Session.updateOne(
        { sessionId: table.currentSessionId },
        { active: false }
      )
    }

    try { getIO().to("admin").emit("tableUpdated"); } catch (e) { }

    res.json({ success: true, message: `Table ${tableNumber} released` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}