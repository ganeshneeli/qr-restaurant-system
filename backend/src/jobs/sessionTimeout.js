const cron = require("node-cron")
const Session = require("../models/Session")
const Table = require("../models/Table")

cron.schedule("*/10 * * * *", async () => {
  const expired = await Session.find({
    expiresAt: { $lt: new Date() },
    active: true
  })

  for (let s of expired) {
    await Table.updateOne(
      { _id: s.tableId },
      { status: "available", currentSessionId: null }
    )
    s.active = false
    await s.save()
  }
})