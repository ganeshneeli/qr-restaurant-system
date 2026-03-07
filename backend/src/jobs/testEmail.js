require("dotenv").config()
const mongoose = require("mongoose")
const { sendMonthlyReport } = require("./monthlyRevenue")
const connectDB = require("../config/db")

const runTest = async () => {
    console.log("🚀 Starting Brevo Email Test...")

    // Check if API key exists
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
        console.error("❌ ERROR: BREVO_API_KEY is not set in .env file.")
        process.exit(1)
    }

    try {
        await connectDB()
        console.log("✅ Database connected.")

        console.log("📦 Triggering manual monthly report...")
        await sendMonthlyReport()

        console.log("\n✨ Test completed! Check the logs above for success or errors.")
        console.log("If successful, your administrators should receive an email shortly.")

        process.exit(0)
    } catch (error) {
        console.error("❌ Test failed:", error.message)
        process.exit(1)
    }
}

runTest()
