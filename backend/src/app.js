const express = require("express")
const helmet = require("helmet")
const path = require("path")
const cors = require("cors")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const connectDB = require("./config/db")
require("./jobs/sessionTimeout")
require("./jobs/monthlyRevenue")

connectDB()

const app = express()

app.use(helmet())
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url} from origin: ${req.headers.origin}`)
  next()
})
app.use(cors({
  origin: (origin, callback) => {
    // For development, allow all origins to avoid CORS issues with localhost/127.0.0.1 mismatch
    callback(null, true)
  },
  credentials: true
}))
app.use(express.json())
app.use(morgan("dev"))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
}))

app.use("/images", express.static(path.join(__dirname, "../public/images")))

app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/table", require("./routes/tableRoutes"))
app.use("/api/orders", require("./routes/orderRoutes"))
app.use("/api/menu", require("./routes/menuRoutes"))
app.use("/api/feedback", require("./routes/feedbackRoutes"))

app.use(require("./middleware/errorHandler"))

module.exports = app