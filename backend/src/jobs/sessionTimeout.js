const cron = require("node-cron")
const mongoose = require("mongoose")
const Session = require("../models/Session")
const Table = require("../models/Table")

cron.schedule("*/10 * * * *", async () => {
  // Check if database is connected before running
  if (mongoose.connection.readyState !== 1) {
    return console.warn("[NODE-CRON] Skipping session timeout job: Database not connected")
  }

  try {
    const expired = await Session.find({
      expiresAt: { $lt: new Date() },
      active: true
    })

    if (expired.length > 0) {
      console.log(`[NODE-CRON] Processing ${expired.length} expired sessions`)
    }

    for (let s of expired) {
      await Table.updateOne(
        { _id: s.tableId },
        { status: "available", currentSessionId: null }
      )
      s.active = false
      await s.save()
    }
  } catch (error) {
    console.error(`[NODE-CRON] Error in session timeout job: ${error.message}`)
  }
})