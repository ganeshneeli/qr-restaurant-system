const socketIo = require("socket.io")
const jwt = require("jsonwebtoken")

let io

exports.initSocket = async (server) => {
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")
  
  io = socketIo(server, {
    cors: { 
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      },
      credentials: true
    }
  })

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    console.log(`[Socket Handshake] Attempt: ${socket.id}, Token: ${token ? "YES" : "NO"}`)
    
    if (!token) {
      socket.user = null
      return next()
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded 
      console.log(`[Socket Handshake] SUCCESS: ${socket.id}, Role: ${decoded.role || "customer"}, UserID: ${decoded.id || decoded.sessionId}`)
      next()
    } catch (err) {
      console.error(`[Socket Handshake] FAILED: ${socket.id}, Error: ${err.message}`)
      socket.user = null
      next()
    }
  })

  io.on("connection", (socket) => {
    const userDisplay = socket.user ? (socket.user.id || socket.user.sessionId) : "Unauthenticated"
    const roleDisplay = socket.user?.role || "customer"
    console.log(`[Socket] Connected: ${socket.id} (User: ${userDisplay}, Role: ${roleDisplay})`)

    // Customer joins their table-specific room — MUST match their token's tableNumber
    socket.on("joinTable", (tableNumber) => {
      if (socket.user && socket.user.tableNumber && socket.user.tableNumber == tableNumber) {
        socket.join(`table-${tableNumber}`)
        console.log(`[Socket] Table room joined: table-${tableNumber}`)
      } else {
        console.warn(`[Socket] Unauthorized join attempt for table-${tableNumber} by ${socket.id}`)
      }
    })

    // Admin joins the admin-specific room
    socket.on("joinAdmin", () => {
      console.log(`[Socket Room] joinAdmin requested by: ${socket.id}, User:`, socket.user)
      if (socket.user && socket.user.id && socket.user.role === "admin") { 
        socket.join("admin")
        socket.emit("joinAdminSuccess")
        console.log(`[Socket Room] SUCCESS: Admin room joined by ${socket.id}`)
      } else {
        console.warn(`[Socket Room] FAILED: Admin join attempt by ${socket.id}`)
      }
    })

    // Kitchen staff joins kitchen room
    socket.on("joinKitchen", () => {
      console.log(`[Socket Room] joinKitchen requested by: ${socket.id}, Role:`, socket.user?.role)
      if (socket.user && socket.user.id && (socket.user.role === "kitchen" || socket.user.role === "admin")) {
        socket.join("kitchen")
        socket.emit("joinKitchenSuccess")
        console.log(`[Socket Room] SUCCESS: Kitchen room joined by ${socket.id}`)
      } else {
        console.warn(`[Socket Room] FAILED: Kitchen join attempt by ${socket.id}`)
      }
    })

    // Waiter joins waiter room
    socket.on("joinWaiter", () => {
      console.log(`[Socket Room] joinWaiter requested by: ${socket.id}, Role:`, socket.user?.role)
      if (socket.user && socket.user.id && (socket.user.role === "waiter" || socket.user.role === "admin")) {
        socket.join("waiter")
        socket.emit("joinWaiterSuccess")
        console.log(`[Socket Room] SUCCESS: Waiter room joined by ${socket.id}`)
      } else {
        console.warn(`[Socket Room] FAILED: Waiter join attempt by ${socket.id}`)
      }
    })

    // Clean up when customer leaves
    socket.on("leave-table", (tableNumber) => {
      socket.leave(`table-${tableNumber}`)
      console.log(`[Socket] Table room left: table-${tableNumber}`)
    })

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`)
    })
  })
}

exports.emitToAdmin = (event, data) => {
  try {
    const io = exports.getIO()
    io.to("admin").emit(event, data)
    console.log(`[Socket Broadcast] Event: ${event} → room: admin`)
  } catch (err) {
    console.warn(`[Socket Broadcast] FAILED: ${event}. Error: ${err.message}`)
  }
}

exports.emitToKitchen = (event, data) => {
  try {
    const io = exports.getIO()
    io.to("kitchen").emit(event, data)
    console.log(`[Socket Broadcast] Event: ${event} → room: kitchen`)
  } catch (err) {
    console.warn(`[Socket Broadcast] FAILED: ${event}. Error: ${err.message}`)
  }
}

exports.emitToWaiter = (event, data) => {
  try {
    const io = exports.getIO()
    io.to("waiter").emit(event, data)
    console.log(`[Socket Broadcast] Event: ${event} → room: waiter`)
  } catch (err) {
    console.warn(`[Socket Broadcast] FAILED: ${event}. Error: ${err.message}`)
  }
}

exports.emitToTable = (tableNumber, event, data) => {
  try {
    const io = exports.getIO()
    io.to(`table-${tableNumber}`).emit(event, data)
    console.log(`[Socket Broadcast] Event: ${event} → room: table-${tableNumber}`)
  } catch (err) {
    console.warn(`[Socket Broadcast] FAILED: ${event} for table ${tableNumber}. Error: ${err.message}`)
  }
}

exports.emitToAll = (event, data) => {
  try {
    const io = exports.getIO()
    io.emit(event, data)
    console.log(`[Socket Broadcast] Event: ${event} → ALL clients`)
  } catch (err) {
    console.warn(`[Socket Broadcast] FAILED (global): ${event}. Error: ${err.message}`)
  }
}

exports.getIO = () => {
  if (!io) throw new Error("Socket not initialized")
  return io
}