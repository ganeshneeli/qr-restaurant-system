require("dotenv").config()
const mongoose = require("mongoose")
const Feedback = require("./src/models/Feedback")

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB. Deleting all customer reviews...")
    const result = await Feedback.deleteMany({})
    console.log(`✅ Success! Deleted ${result.deletedCount} reviews.`)
    process.exit(0)
}).catch(err => {
    console.error("❌ Error connecting to database:", err)
    process.exit(1)
})
