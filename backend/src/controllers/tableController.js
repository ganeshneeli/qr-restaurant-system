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
    const tables = await Table.find({}).sort({ tableNumber: 1 }).lean()
    const formattedTables = tables.map(t => ({
      ...t,
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
    const url = `${frontendBaseUrl}/#/table/${tableNumber}`
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
  const cacheKey = "all_table_qrs";
  const redisClient = require("../config/redis");

  try {
    // 1. Try Cache
    if (redisClient.isReadyForCommands()) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: JSON.parse(cached), source: "cache" });
      }
    }

    // 2. Generate (Fallback)
    const tables = await Table.find({}).sort({ tableNumber: 1 }).lean();
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    
    const qrPromises = tables.map(async (table) => {
      const url = `${frontendBaseUrl}/#/table/${table.tableNumber}`
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

    // 3. Cache results (1 hour TTL)
    if (redisClient.isReadyForCommands()) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(qrs));
    }

    res.json({ success: true, data: qrs, source: "generated" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Internal Helper to Clear QR Cache
const invalidateQrCache = async () => {
    const redisClient = require("../config/redis");
    try {
        if (redisClient.isReadyForCommands()) {
            await redisClient.del("all_table_qrs");
        }
    } catch (e) {
        console.error("Failed to invalidate QR cache:", e.message);
    }
};

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
exports.addTable = async (req, res) => {
  try {
    const lastTable = await Table.findOne().sort({ tableNumber: -1 })
    const nextNumber = lastTable ? lastTable.tableNumber + 1 : 1
    const newTable = await Table.create({ tableNumber: nextNumber })

    await invalidateQrCache();
    try { getIO().to("admin").emit("tableUpdated"); } catch (e) { }

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
    await invalidateQrCache();

    try { getIO().to("admin").emit("tableUpdated"); } catch (e) { }

    res.json({ success: true, message: "Table removed successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
