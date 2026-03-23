const socketIo = require("socket.io")
const { createAdapter } = require("@socket.io/redis-adapter")
const redisClient = require("./redis")

let io

exports.initSocket = async (server) => {
  try {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    // Set short timeout for initial connection to avoid blocking Render's port binding too long
    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    io = socketIo(server, {
      cors: { origin: "*" },
      adapter: createAdapter(pubClient, subClient)
    })
    console.log("[Socket] Redis Adapter initialized");
  } catch (err) {
    console.error("[Socket] Redis Adapter failed to initialize, falling back to in-memory:", err.message);
    io = socketIo(server, {
      cors: { origin: "*" }
    })
  }
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