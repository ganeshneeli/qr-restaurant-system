require("dotenv").config()
const mongoose = require("mongoose")
const Order = require("./src/models/Order")

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB. Deleting all orders...")
    const result = await Order.deleteMany({})
    console.log(`✅ Success! Deleted ${result.deletedCount} orders.`)
    process.exit(0)
}).catch(err => {
    console.error("❌ Error connecting to database:", err)
    process.exit(1)
})
