const cron = require("node-cron")
const mongoose = require("mongoose")
const Session = require("../models/Session")
const Table = require("../models/Table")
const Order = require("../models/Order")

// Lazy-load socket to avoid circular deps at module load time
const getSocket = () => {
  try { return require("../config/socket") } catch { return null }
}

cron.schedule("*/1 * * * *", async () => {
  if (mongoose.connection.readyState !== 1) return

  try {
    const now = new Date()
    const socket = getSocket()

    // ─────────────────────────────────────────────────────────────────────────
    // RULE 1: IDLE NO-ORDER TIMEOUT — 15 minutes
    // If a customer scanned the QR but placed NO order within 15 min,
    // auto-logout them and free the table.
    // ─────────────────────────────────────────────────────────────────────────
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const idleNoOrderSessions = await Session.find({
      startedAt: { $lt: fifteenMinsAgo },
      active: true
    })

    const idleToRelease = []
    for (const s of idleNoOrderSessions) {
      const orderCount = await Order.countDocuments({ sessionId: s.sessionId })
      if (orderCount === 0) {
        // No order placed — release immediately
        idleToRelease.push(s)
      }
    }

    if (idleToRelease.length > 0) {
      console.log(`[CRON] 🕐 Idle timeout: releasing ${idleToRelease.length} no-order session(s)`)

      for (const s of idleToRelease) {
        const table = await Table.findByIdAndUpdate(
          s.tableId,
          { status: "available", currentSessionId: null, startedAt: null },
          { new: true }
        )
        await Session.updateOne({ sessionId: s.sessionId }, { active: false })

        // Notify all clients so the customer's Menu page detects the expiry
        if (socket && table) {
          try {
            socket.emitToAll("sessionExpired", { tableNumber: table.tableNumber, sessionId: s.sessionId })
            socket.emitToAll("tableStatusChanged", { tableNumber: table.tableNumber, status: "free" })
            socket.emitToAdmin("tableStatusChanged", { tableNumber: table.tableNumber, status: "free" })
          } catch {}
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RULE 2: HARD EXPIRY — sessions that exceeded their 4h max duration
    // This catches any session regardless of order status.
    // ─────────────────────────────────────────────────────────────────────────
    const hardExpired = await Session.find({ expiresAt: { $lt: now }, active: true })

    if (hardExpired.length > 0) {
      console.log(`[CRON] ⏰ Hard expiry: releasing ${hardExpired.length} session(s)`)

      for (const s of hardExpired) {
        const table = await Table.findByIdAndUpdate(
          s.tableId,
          { status: "available", currentSessionId: null, startedAt: null },
          { new: true }
        )
        await Session.updateOne({ sessionId: s.sessionId }, { active: false })

        if (socket && table) {
          try {
            socket.emitToAll("sessionExpired", { tableNumber: table.tableNumber, sessionId: s.sessionId })
            socket.emitToAll("tableStatusChanged", { tableNumber: table.tableNumber, status: "free" })
          } catch {}
        }
      }
    }

  } catch (error) {
    console.error(`[CRON] Error in session job: ${error.message}`)
  }
})