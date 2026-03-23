const Menu = require("../models/Menu")
const { getIO } = require("../config/socket")
const redisClient = require("../config/redis")

const invalidateMenuCache = async () => {
  try {
    const trackingKey = "menu_cache_keys";
    const keys = await redisClient.sMembers(trackingKey);
    if (keys.length > 0) {
      await Promise.all([
        redisClient.del(keys),
        redisClient.del(trackingKey)
      ]);
      console.log(`Menu cache invalidated (${keys.length} keys)`);
    }
  } catch (err) {
    console.error("Failed to invalidate menu cache", err);
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const cacheKey = `menu_${category || "All"}_${search || "NoSearch"}_${page}_${limit}`;

    // Try to get from cache
    const cachedData = await redisClient.get(cacheKey);
    let responseData = cachedData ? JSON.parse(cachedData) : null;

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

      const items = await Menu.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const totalCount = await Menu.countDocuments(query);

      responseData = {
        data: items,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
          currentPage: Number(page),
          limit: Number(limit)
        }
      };

      // Store in cache (items and pagination only)
      const trackingKey = "menu_cache_keys";
      await Promise.all([
        redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData)),
        redisClient.sAdd(trackingKey, cacheKey)
      ]);
      // Optional: set expiry on the tracking key too
      await redisClient.expire(trackingKey, 3600);
    }

    // Always fetch active AND upcoming flash sales fresh (or with very short cache)
    const now = new Date();
    const activeFlashSales = Number(page) === 1
      ? await Menu.find({
        isFlashSale: true,
        available: true,
        saleEndTime: { $gte: now } // We only verify it hasn't ended yet
      })
      : [];

    res.json({
      success: true,
      ...responseData,
      flashSales: activeFlashSales
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