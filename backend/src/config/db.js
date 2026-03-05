const mongoose = require("mongoose")

module.exports = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...")
    })

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected")
    })
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    // Don't exit process, let it retry or fail gracefully
  }
}