const cron = require("node-cron")
const mongoose = require("mongoose")
const Session = require("../models/Session")
const Table = require("../models/Table")
const Order = require("../models/Order")

cron.schedule("*/5 * * * *", async () => {
  if (mongoose.connection.readyState !== 1) return

  try {
    const now = new Date()

    // 1. HARD EXPIRY: Handle sessions that have reached their max duration (2h)
    const expired = await Session.find({ expiresAt: { $lt: now }, active: true })
    
    // 2. IDLE TIMEOUT: Handle tables occupied for > 15m with NO orders
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const idleSessions = await Session.find({
      startedAt: { $lt: fifteenMinsAgo },
      active: true
    })

    const allSessionsToProcess = [...expired]
    
    for (let s of idleSessions) {
      // Check if any order exists for this session
      const orderCount = await Order.countDocuments({ sessionId: s.sessionId })
      if (orderCount === 0) {
        allSessionsToProcess.push(s)
      }
    }

    if (allSessionsToProcess.length > 0) {
      console.log(`[NODE-CRON] Releasing ${allSessionsToProcess.length} sessions (Expired/Idle)`)
      
      const sessionIds = allSessionsToProcess.map(s => s.sessionId)
      const tableIds = allSessionsToProcess.map(s => s.tableId)

      await Table.updateMany(
        { _id: { $in: tableIds } },
        { status: "available", currentSessionId: null, startedAt: null }
      )
      
      await Session.updateMany(
        { sessionId: { $in: sessionIds } },
        { active: false }
      )
    }
  } catch (error) {
    console.error(`[NODE-CRON] Error in session job: ${error.message}`)
  }
})