const Order = require("../models/Order")
const Menu = require("../models/Menu")
const Table = require("../models/Table")
const Session = require("../models/Session")
const { getIO } = require("../config/socket")

// HELPER: Send socket events to SPECIFIC rooms
const emitToTable = (tableNumber, event, data) => {
  getIO().to(`table-${tableNumber}`).emit(event, data)
}

const emitToAdmin = (event, data) => {
  getIO().to("admin").emit(event, data)
}

// Admin: Get all active orders
exports.getAllOrders = async (req, res) => {
  try {
    const showAll = req.query.status === "all"
    const query = showAll ? {} : { status: { $ne: "completed" } }
    const orders = await Order.find(query).sort({ createdAt: -1 })
    res.json({ success: true, orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Dashboard summary
exports.getDailySummary = async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayOrders, monthOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: today } }),
      Order.find({
        createdAt: { $gte: startOfMonth },
        status: "completed"
      })
    ])

    const totalOrders = todayOrders.length
    const totalRevenue = todayOrders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    const totalMonthlyRevenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    res.json({ success: true, totalOrders, totalRevenue, totalMonthlyRevenue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Customer: Get current table's order
exports.getMyOrder = async (req, res) => {
  try {
    const { sessionId, tableNumber } = req.session
    const order = await Order.findOne({
      sessionId,
      tableNumber,
      status: { $ne: "completed" }
    })

    if (!order) return res.json({ success: true, data: null })
    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Customer: Place/Update order
exports.createOrder = async (req, res) => {
  try {
    const { sessionId, tableId, tableNumber } = req.session
    let total = 0
    let validated = []

    for (let item of req.body.items) {
      const menu = await Menu.findById(item.foodId)
      if (!menu || !menu.available) return res.status(400).json({ success: false })
      total += menu.price * item.quantity
      validated.push({ foodId: menu._id, name: menu.name, price: menu.price, quantity: item.quantity })
    }

    let order = await Order.findOne({ sessionId, tableNumber, status: { $ne: "completed" } })

    if (order) {
      for (let newItem of validated) {
        const existing = order.items.find(i => i.foodId?.toString() === newItem.foodId.toString())
        if (existing) existing.quantity += newItem.quantity
        else order.items.push(newItem)

        // Increment order_count in Menu
        await Menu.findByIdAndUpdate(newItem.foodId, { $inc: { order_count: newItem.quantity } })
      }
      order.totalAmount += total
      order.status = "pending"
      order.billRequested = false
      if (req.body.specialNote) {
        order.specialNote = req.body.specialNote
      }
      await order.save()
    } else {
      order = await Order.create({
        tableId,
        tableNumber,
        sessionId,
        items: validated,
        totalAmount: total,
        specialNote: req.body.specialNote || ""
      })
      // Increment order_count for each item
      for (let item of validated) {
        await Menu.findByIdAndUpdate(item.foodId, { $inc: { order_count: item.quantity } })
      }
    }

    // Notify only admins about the new order
    emitToAdmin("newOrder", order)
    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Customer: Request bill
exports.requestBill = async (req, res) => {
  try {
    const { sessionId, tableNumber } = req.session
    const order = await Order.findOneAndUpdate(
      { sessionId, tableNumber, status: { $ne: "completed" } },
      { billRequested: true },
      { new: true }
    )

    if (!order) return res.status(404).json({ success: false })

    // Notify specific table and admin
    emitToTable(tableNumber, "billRequested", { tableNumber, orderId: order._id })
    emitToAdmin("billRequested", { tableNumber, orderId: order._id })

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Update order status
exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false })

    order.status = req.body.status
    await order.save()

    // Release table if completed
    if (order.status === "completed") {
      await Table.updateOne({ _id: order.tableId }, { status: "available", currentSessionId: null })
      await Session.updateOne({ sessionId: order.sessionId }, { active: false })
    }

    // Notify specific table and admin
    const payload = { orderId: order._id, status: order.status, tableNumber: order.tableNumber }
    emitToTable(order.tableNumber, "orderStatusUpdated", payload)
    emitToAdmin("orderStatusUpdated", payload)

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Mark as paid
exports.markAsPaid = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "paid", status: "completed" },
      { new: true }
    )

    if (!order) return res.status(404).json({ success: false })

    await Table.updateOne({ _id: order.tableId }, { status: "available", currentSessionId: null, startedAt: null })
    await Session.updateOne({ sessionId: order.sessionId }, { active: false })

    const payload = { orderId: order._id, tableNumber: order.tableNumber, status: "completed" }
    emitToTable(order.tableNumber, "orderPaid", payload)
    emitToAdmin("orderPaid", payload)

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const mostOrdered = await Menu.find({ order_count: { $gt: 0 } }).sort({ order_count: -1 }).limit(10)
    const leastOrdered = await Menu.find({ order_count: { $gte: 0 } }).sort({ order_count: 1 }).limit(10)

    // Daily trends (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const trends = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      success: true,
      data: {
        mostOrdered,
        leastOrdered,
        dailyTrends: trends
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}