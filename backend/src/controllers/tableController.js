const Table = require("../models/Table")
const Session = require("../models/Session")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")
const QRCode = require("qrcode")
const crypto = require("crypto")
const { emitToAdmin } = require("../config/socket")

// Helper to generate a security signature for a table
const generateSignature = (tableNumber) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(String(tableNumber))
    .digest("hex")
    .substring(0, 16) // 16 chars is enough for a URL signature
}

exports.activateTable = async (req, res) => {
  const { tableNumber } = req.params
  const { signature } = req.body

  // LAYER 1: Verify signed QR URL
  const expectedSignature = generateSignature(tableNumber)
  if (signature !== expectedSignature) {
    return res.status(403).json({ 
      success: false, 
      message: "Invalid QR Signature. Please use the official table QR code." 
    })
  }

  const sessionId = uuidv4()
  const table = await Table.findOneAndUpdate(
    { tableNumber: tableNumber, status: "available" },
    { status: "occupied", currentSessionId: sessionId, startedAt: new Date() },
    { new: true }
  )

  if (!table)
    return res.status(400).json({ success: false, message: "Table occupied or invalid" })

  // LAYER 3: 15-minute Token/Session Expiry (Industry Standard for anti-misuse)
  const EXPIRY_TIME = 15 * 60 * 1000 // 15 mins
  
  await Session.create({
    sessionId,
    tableId: table._id,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + EXPIRY_TIME)
  })

  const token = jwt.sign(
    { sessionId, tableNumber: table.tableNumber, tableId: table._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Strict 15 min expiry
  )

  emitToAdmin("tableStatusChanged")

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
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    
    // Add signature to the URL
    const signature = generateSignature(tableNumber)
    const url = `${frontendBaseUrl}/#/table/${tableNumber}?s=${signature}`
    
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

exports.getAllTableQRs = async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ tableNumber: 1 })
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    
    const qrPromises = tables.map(async (table) => {
      const signature = generateSignature(table.tableNumber)
      const url = `${frontendBaseUrl}/#/table/${table.tableNumber}?s=${signature}`
      
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 250,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" }
      })
      return {
        tableNumber: table.tableNumber,
        qr: qrDataUrl,
        url
      }
    })

    const qrs = await Promise.all(qrPromises)
    res.json({ success: true, data: qrs })
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

    if (table.currentSessionId) {
      await Session.updateOne(
        { sessionId: table.currentSessionId },
        { active: false }
      )
    }

    emitToAdmin("tableStatusChanged")

    res.json({ success: true, message: `Table ${tableNumber} released` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
exports.addTable = async (req, res) => {
  try {
    const lastTable = await Table.findOne().sort({ tableNumber: -1 })
    const nextNumber = lastTable ? lastTable.tableNumber + 1 : 1
    const newTable = await Table.create({ tableNumber: nextNumber })

    emitToAdmin("tableStatusChanged")

    res.json({ success: true, data: newTable })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.removeTable = async (req, res) => {
  try {
    const { tableNumber } = req.params
    const table = await Table.findOne({ tableNumber })
    if (!table) return res.status(404).json({ success: false, message: "Table not found" })

    if (table.status === "occupied") {
      return res.status(400).json({ success: false, message: "Cannot remove an occupied table" })
    }

    await Table.deleteOne({ tableNumber })

    emitToAdmin("tableStatusChanged")

    res.json({ success: true, message: "Table removed successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
