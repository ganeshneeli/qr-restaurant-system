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
    console.log(`[Socket] Connected: ${socket.id} (User: ${socket.user.id || socket.user.sessionId})`)

    // Customer joins their table-specific room — MUST match their token's tableNumber
    socket.on("join-table", (tableNumber) => {
      if (socket.user && socket.user.tableNumber && socket.user.tableNumber == tableNumber) {
        socket.join(`table-${tableNumber}`)
        console.log(`[Socket] Table room joined: table-${tableNumber}`)
      } else {
        console.warn(`[Socket] Unauthorized join attempt for table-${tableNumber} by ${socket.id}`)
      }
    })

    // Admin joins the admin-specific room — MUST have admin-like payload (id)
    socket.on("join-admin", () => {
      if (socket.user && socket.user.id) { // Admin tokens have 'id', customer tokens have 'sessionId'
        socket.join("admin")
        console.log(`[Socket] Admin room joined by ${socket.id}`)
      } else {
        console.warn(`[Socket] Unauthorized admin join attempt by ${socket.id}`)
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