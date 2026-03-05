const socketIo = require("socket.io")

let io

exports.initSocket = (server) => {
  io = socketIo(server, {
    cors: { origin: "*" }
  })

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    // Customer joins their table-specific room
    socket.on("join-table", (tableNumber) => {
      socket.join(`table-${tableNumber}`)
      console.log(`[Socket] Table room joined: table-${tableNumber}`)
    })

    // Admin joins the admin-specific room
    socket.on("join-admin", () => {
      socket.join("admin")
      console.log(`[Socket] Admin room joined`)
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