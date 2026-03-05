const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./src/models/User");
require("dotenv").config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = "owner@og.com";
  const password = "password123";

  const existing = await User.findOne({ email });
  if (existing) {
    if (await bcrypt.compare(password, existing.password)) {
      console.log("Admin exists and password correct.");
    } else {
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      console.log("Admin exists, reset password to: " + password);
    }
  } else {
    await User.create({
      name: "Owner",
      email: email,
      password: await bcrypt.hash(password, 10),
      role: "admin"
    });
    console.log("Created admin account: " + email + " / " + password);
  }
  mongoose.connection.close();
}
seed();
