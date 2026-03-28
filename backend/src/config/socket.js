const socketIo = require("socket.io")
const jwt = require("jsonwebtoken")

let io

exports.initSocket = async (server) => {
  io = socketIo(server, {
    cors: { 
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  })

  // Middleware to authenticate socket connections (Optional for connection, mandatory for rooms)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    
    if (!token) {
      socket.user = null // Allow connection, but no room access
      return next()
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded 
      next()
    } catch (err) {
      // If token is invalid, we still allow connection but user is null
      socket.user = null
      next()
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.user?.id || socket.user?.sessionId || "anonymous"
    console.log(`[Socket] Connected: ${socket.id} (User: ${userId})`)

    // Customer joins their table-specific room
    socket.on("join-table", (tableNumber) => {
      if (socket.user && socket.user.tableNumber && socket.user.tableNumber == tableNumber) {
        socket.join(`table-${tableNumber}`)
        console.log(`[Socket] Room Join: table-${tableNumber} (Socket: ${socket.id})`)
      } else {
        console.warn(`[Socket] Unauthorized join: table-${tableNumber} (User: ${userId})`)
      }
    })

    // Admin joins the admin-specific room
    socket.on("join-admin", (callback) => {
      if (socket.user && socket.user.id) { 
        socket.join("admin")
        console.log(`[Socket] Room Join: admin (Socket: ${socket.id})`)
        if (callback) callback({ success: true, room: "admin" })
      } else {
        console.warn(`[Socket] Unauthorized admin join (User: ${userId})`)
        if (callback) callback({ success: false, message: "Unauthorized" })
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

exports.getIO = () => {
  if (!io) throw new Error("Socket not initialized")
  return io
}