const Menu = require("../models/Menu")
const { getIO } = require("../config/socket")
const redisClient = require("../config/redis")

const invalidateMenuCache = async () => {
  try {
    if (redisClient.isReadyForCommands()) {
      const keys = await redisClient.keys("menu_*");
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log("Menu cache invalidated");
      }
    }
  } catch (err) {
    console.error("Failed to invalidate menu cache:", err.message);
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const cacheKey = `menu_v2_${category || "all"}_${search || "none"}_${page}_${limit}`;
    let responseData = null;
    try {
      if (redisClient.isReadyForCommands()) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          responseData = JSON.parse(cachedData);
          console.log(`Menu cache hit: ${cacheKey}`);
        }
      }
    } catch (err) {
      console.warn("Redis GET failed for menu, falling back to DB:", err.message);
    }

    const now = new Date();
    
    if (!responseData) {
      let query = {};
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

      // Fetch menu and count in parallel
      const [items, totalCount] = await Promise.all([
        Menu.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Menu.countDocuments(query)
      ]);

      responseData = {
        data: items || [],
        pagination: {
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / Number(limit)),
          currentPage: Number(page),
          limit: Number(limit)
        }
      };

      // Store in cache
      try {
        if (redisClient.isReadyForCommands()) {
          await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
        }
      } catch (err) {
        console.warn("Redis SETEX failed for menu:", err.message);
      }
    }

    // Always fetch active flash sales, potentially in parallel with other logic if needed
    const activeFlashSales = Number(page) === 1
      ? await Menu.find({
        isFlashSale: true,
        available: true,
        saleEndTime: { $gte: now }
      }).lean()
      : [];

    res.json({
      success: true,
      ...(responseData || { data: [], pagination: { totalCount: 0, totalPages: 1, currentPage: 1, limit: 12 } }),
      flashSales: activeFlashSales || []
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

    invalidateMenuCache();
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

    // Invalidate cache
    invalidateMenuCache();

    getIO().emit("menuUpdate", { type: "create", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  const item = await Menu.findById(req.params.id)
  item.available = !item.available
  await item.save()

  // Invalidate cache
  invalidateMenuCache();

  getIO().emit("menuUpdate", { type: "toggle", item })
  res.json({ success: true, data: item })
}

exports.updateMenu = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    if (data.price) data.price = Number(data.price);

    const item = await Menu.findByIdAndUpdate(req.params.id, data, { new: true });

    // Invalidate cache
    invalidateMenuCache();

    getIO().emit("menuUpdate", { type: "update", item });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id)

  // Invalidate cache
  invalidateMenuCache();

  getIO().emit("menuUpdate", { type: "delete", id: req.params.id })
  res.json({ success: true, message: "Item deleted" })
}