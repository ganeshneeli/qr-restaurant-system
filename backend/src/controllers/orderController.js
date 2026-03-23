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

// Admin: Get all orders (active or history) with pagination
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const showAll = status === "all"
    const query = showAll ? {} : { status: { $ne: "completed" } }
    
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({ 
      success: true, 
      orders,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Dashboard summary
exports.getDailySummary = async (req, res) => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart }
        }
      },
      {
        $facet: {
          todayStats: [
            { $match: { createdAt: { $gte: todayStart } } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0]
                  }
                }
              }
            }
          ],
          monthRevenue: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: null,
                totalMonthlyRevenue: { $sum: "$totalAmount" }
              }
            }
          ]
        }
      }
    ])

    const today = stats[0].todayStats[0] || { totalOrders: 0, totalRevenue: 0 }
    const month = stats[0].monthRevenue[0] || { totalMonthlyRevenue: 0 }

    res.json({
      success: true,
      totalOrders: today.totalOrders,
      totalRevenue: today.totalRevenue,
      totalMonthlyRevenue: month.totalMonthlyRevenue
    })
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
    const items = req.body.items
    const foodIds = items.map(i => i.foodId)
    
    // Fetch all menu items at once to avoid N+1 queries
    const menuItems = await Menu.find({ _id: { $in: foodIds } })
    const menuMap = menuItems.reduce((map, item) => {
      map[item._id.toString()] = item
      return map
    }, {})

    let total = 0
    let validated = []
    
    for (let item of items) {
      const menu = menuMap[item.foodId]
      if (!menu || !menu.available) return res.status(400).json({ success: false, message: `Item ${item.foodId} not available` })

      const now = new Date()
      const isSaleActive = menu.isFlashSale &&
        menu.saleStartTime <= now &&
        menu.saleEndTime >= now &&
        menu.discountPrice

      const currentPrice = isSaleActive ? menu.discountPrice : menu.price
      total += currentPrice * item.quantity
      validated.push({ foodId: menu._id, name: menu.name, price: currentPrice, quantity: item.quantity })
    }

    let order = await Order.findOne({ sessionId, tableNumber, status: { $ne: "completed" } })

    if (order) {
      const bulkOps = []
      for (let newItem of validated) {
        const existing = order.items.find(i => i.foodId?.toString() === newItem.foodId.toString())
        if (existing) existing.quantity += newItem.quantity
        else order.items.push(newItem)

        bulkOps.push({
          updateOne: {
            filter: { _id: newItem.foodId },
            update: { $inc: { order_count: newItem.quantity } }
          }
        })
      }
      if (bulkOps.length > 0) await Menu.bulkWrite(bulkOps)
      
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
      
      const bulkOps = validated.map(item => ({
        updateOne: {
          filter: { _id: item.foodId },
          update: { $inc: { order_count: item.quantity } }
        }
      }))
      if (bulkOps.length > 0) await Menu.bulkWrite(bulkOps)
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
    // Daily trends (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [mostOrdered, leastOrdered, trends] = await Promise.all([
      Menu.find({ order_count: { $gt: 0 } }).sort({ order_count: -1 }).limit(10).lean(),
      Menu.find({ order_count: { $gte: 0 } }).sort({ order_count: 1 }).limit(10).lean(),
      Order.aggregate([
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
    ]);

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