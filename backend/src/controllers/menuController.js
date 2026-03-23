const Menu = require("../models/Menu")
const { getIO } = require("../config/socket")
const NodeCache = require("node-cache")

// Cache for 1 hour, check every 2 minutes
const menuCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 })

const clearMenuCache = () => {
  const keys = menuCache.keys()
  if (keys.length > 0) {
    menuCache.del(keys)
    console.log("🧹 Menu cache cleared")
  }
}

exports.getMenu = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, forceRefresh } = req.query;
    
    // Generate a unique cache key based on query params
    const cacheKey = `menu_${category || 'All'}_${search || ''}_${page}_${limit}`
    
    if (!forceRefresh) {
      const cachedData = menuCache.get(cacheKey)
      if (cachedData) {
        return res.json({ success: true, ...cachedData, cached: true })
      }
    }

    let query = { available: true }; // Only show available items to customers
    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const items = await Menu.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Menu.countDocuments(query);

    // Always fetch active AND upcoming flash sales fresh
    const now = new Date();
    const activeFlashSales = Number(page) === 1
      ? await Menu.find({
        isFlashSale: true,
        available: true,
        saleEndTime: { $gte: now } 
      })
      : [];

    const responseData = {
      data: items,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      },
      flashSales: activeFlashSales
    };

    // Store in cache
    menuCache.set(cacheKey, responseData)

    res.json({
      success: true,
      ...responseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFlashSale, discountPrice, saleStartTime, saleEndTime } = req.body;

    const item = await Menu.findByIdAndUpdate(
      id,
      {
        isFlashSale,
        discountPrice: isFlashSale ? Number(discountPrice) : undefined,
        saleStartTime: isFlashSale ? new Date(saleStartTime) : undefined,
        saleEndTime: isFlashSale ? new Date(saleEndTime) : undefined
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    clearMenuCache()
    getIO().emit("menuUpdate", { type: "flashSaleUpdate", item });

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.createMenu = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    // Handle numeric fields if sent as strings via FormData
    if (data.price) data.price = Number(data.price);

    const item = await Menu.create(data);

    clearMenuCache()
    getIO().emit("menuUpdate", { type: "create", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: "Item not found" })
    
    item.available = !item.available
    await item.save()

    clearMenuCache()
    getIO().emit("menuUpdate", { type: "toggle", item })
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateMenu = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    if (data.price) data.price = Number(data.price);

    const item = await Menu.findByIdAndUpdate(req.params.id, data, { new: true });

    clearMenuCache()
    getIO().emit("menuUpdate", { type: "update", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id)

    clearMenuCache()
    getIO().emit("menuUpdate", { type: "delete", id: req.params.id })
    res.json({ success: true, message: "Item deleted" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}