const express = require("express")
const helmet = require("helmet")
const path = require("path")
const cors = require("cors")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const connectDB = require("./config/db")

require("./jobs/sessionTimeout")
require("./jobs/monthlyRevenue")

connectDB()

const app = express()
app.set("trust proxy", 1)

const logger = require("./config/logger")

app.use(helmet())
app.use(compression())
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`)
  next()
})

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
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

const promBundle = require("express-prom-bundle");
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true });
app.use(metricsMiddleware);

app.use("/api/health", require("./routes/healthRoutes"))
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: "Too many login attempts, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
})

app.use("/api/auth", authLimiter, require("./routes/authRoutes"))
app.use("/api/table", require("./routes/tableRoutes"))
app.use("/api/orders", require("./routes/orderRoutes"))
app.use("/api/menu", require("./routes/menuRoutes"))
app.use("/api/feedback", require("./routes/feedbackRoutes"))

app.use(require("./middleware/errorHandler"))

module.exports = app