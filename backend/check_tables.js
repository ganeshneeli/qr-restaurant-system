const mongoose = require("mongoose");
const Table = require("./src/models/Table");
require("dotenv").config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const tables = await Table.find({ tableNumber: { $in: [4, 7, 8, 9] } });
  console.log("Found tables:", tables);
  mongoose.connection.close();
}
check();
