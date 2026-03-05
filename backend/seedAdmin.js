require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const User = require("./src/models/User")

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const email = "owner@og.com"
    const password = "admin123"

    await User.deleteMany({ role: "admin" })

    const hashed = await bcrypt.hash(password, 10)
    await User.create({ email, password: hashed, role: "admin" })

    console.log("✅ Admin account created!")
    console.log(`   Email   : ${email}`)
    console.log(`   Password: ${password}`)
    process.exit()
}).catch(err => {
    console.error("❌ Error:", err)
    process.exit(1)
})
