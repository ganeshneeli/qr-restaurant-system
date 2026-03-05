require("dotenv").config()
const mongoose = require("mongoose")
const Table = require("./src/models/Table")

const TABLE_COUNT = 10

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const existing = await Table.countDocuments()
    if (existing >= TABLE_COUNT) {
        console.log(`✅ Tables already seeded (${existing} tables found)`)
        process.exit()
    }

    const tablesToCreate = []
    for (let i = 1; i <= TABLE_COUNT; i++) {
        const exists = await Table.findOne({ tableNumber: i })
        if (!exists) {
            tablesToCreate.push({ tableNumber: i, status: "available" })
        }
    }

    if (tablesToCreate.length > 0) {
        await Table.insertMany(tablesToCreate)
        console.log(`✅ Seeded ${tablesToCreate.length} tables (${TABLE_COUNT} total)`)
    } else {
        console.log("✅ All tables already exist")
    }

    process.exit()
}).catch(err => {
    console.error("❌ Error seeding tables:", err)
    process.exit(1)
})
