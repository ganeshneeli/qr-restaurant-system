require("dotenv").config()
const mongoose = require("mongoose")
const Menu = require("./src/models/Menu")

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Menu.deleteMany({})

  await Menu.insertMany([
    // SOUPS
    { name: "Sweet Corn Soup", price: 105, category: "Soups" },
    { name: "Veg Manchow Soup", price: 105, category: "Soups" },
    { name: "Veg Hot & Sour Soup", price: 105, category: "Soups" },
    { name: "Tomato Soup", price: 185, category: "Soups" },
    { name: "Veg Clear Soup", price: 185, category: "Soups" },
    { name: "Chicken Sweet Corn Soup", price: 130, category: "Soups" },
    { name: "Chicken Manchow Soup", price: 130, category: "Soups" },
    { name: "Chicken Clear Soup", price: 130, category: "Soups" },
    { name: "Chicken Hot & Sour Soup", price: 145, category: "Soups" },
    { name: "Chicken Coriander Soup", price: 155, category: "Soups" },
    { name: "OG Special Soup", price: 185, category: "Soups" },

    // STARTERS VEG
    { name: "Crispy Corn", price: 145, category: "Starters Veg" },
    { name: "Kaju Fry", price: 220, category: "Starters Veg" },
    { name: "Veg Manchurian", price: 155, category: "Starters Veg" },
    { name: "Gobi Manchurian", price: 129, category: "Starters Veg" },
    { name: "Chilli Gobi", price: 129, category: "Starters Veg" },
    { name: "Pepper Gobi", price: 145, category: "Starters Veg" },
    { name: "Paneer Manchurian", price: 195, category: "Starters Veg" },
    { name: "Chilli Paneer", price: 195, category: "Starters Veg" },
    { name: "Paneer 65", price: 195, category: "Starters Veg" },
    { name: "Mushroom Manchurian", price: 185, category: "Starters Veg" },
    { name: "Mushroom 65", price: 185, category: "Starters Veg" },
    { name: "Chilli Mushroom", price: 185, category: "Starters Veg" },
    { name: "Pepper Mushroom", price: 195, category: "Starters Veg" },
    { name: "Kaju Mushroom", price: 235, category: "Starters Veg" },
    { name: "Baby Corn Manchurian", price: 155, category: "Starters Veg" },
    { name: "Baby Corn 65", price: 155, category: "Starters Veg" },
    { name: "Chilli Baby Corn", price: 155, category: "Starters Veg" },
    { name: "French Fries", price: 169, category: "Starters Veg" },
    { name: "Onion Pakoda", price: 77, category: "Starters Veg" },
    { name: "Veg Pakoda", price: 156, category: "Starters Veg" },

    // STARTERS NON-VEG
    { name: "Chicken 65", price: 195, category: "Starters Non-Veg" },
    { name: "Chicken Manchurian", price: 195, category: "Starters Non-Veg" },
    { name: "Chilli Chicken", price: 195, category: "Starters Non-Veg" },
    { name: "Pepper Chicken", price: 195, category: "Starters Non-Veg" },
    { name: "Lemon Chicken", price: 195, category: "Starters Non-Veg" },
    { name: "Chicken Megistick", price: 210, category: "Starters Non-Veg" },
    { name: "Dragon Chicken", price: 210, category: "Starters Non-Veg" },
    { name: "Kaju Chicken", price: 195, category: "Starters Non-Veg" },
    { name: "Chicken Lollipop", price: 195, category: "Starters Non-Veg" },
    { name: "Chicken Drumstick", price: 195, category: "Starters Non-Veg" },
    { name: "Chicken 555", price: 195, category: "Starters Non-Veg" },
    { name: "Andhra Chicken Fry", price: 195, category: "Starters Non-Veg" },

    // RICE & BIRYANI
    { name: "Veg Fried Rice", price: 103, category: "Rice & Biryani" },
    { name: "Kaju Fried Rice", price: 195, category: "Rice & Biryani" },
    { name: "Mushroom Fried Rice", price: 142, category: "Rice & Biryani" },
    { name: "Paneer Rice", price: 142, category: "Rice & Biryani" },
    { name: "Egg Fried Rice", price: 116, category: "Rice & Biryani" },
    { name: "Chicken Fried Rice", price: 130, category: "Rice & Biryani" },
    { name: "Mixed Fried Rice", price: 210, category: "Rice & Biryani" },
    { name: "Veg Biryani", price: 155, category: "Rice & Biryani" },
    { name: "Mushroom Biryani", price: 170, category: "Rice & Biryani" },
    { name: "Paneer Biryani", price: 170, category: "Rice & Biryani" },
    { name: "Chicken Dum Biryani", price: 180, category: "Rice & Biryani" },
    { name: "Mutton Biryani", price: 299, category: "Rice & Biryani" },
    { name: "Prawns Biryani", price: 286, category: "Rice & Biryani" },
    { name: "Fish Biryani", price: 286, category: "Rice & Biryani" },
    { name: "OG Special Biryani", price: 299, category: "Rice & Biryani" },

    // ROTIS & BREAD
    { name: "Roti Plain", price: 15, category: "Rotis & Bread" },
    { name: "Butter Roti", price: 20, category: "Rotis & Bread" },
    { name: "Naan Plain", price: 35, category: "Rotis & Bread" },
    { name: "Butter Naan", price: 39, category: "Rotis & Bread" },
    { name: "Garlic Naan", price: 46, category: "Rotis & Bread" },

    // TEA & BEVERAGES
    { name: "Irani Tea", price: 20, category: "Tea & Beverages" },
    { name: "Coffee", price: 30, category: "Tea & Beverages" },
    { name: "Lemon Tea", price: 30, category: "Tea & Beverages" },
    { name: "Green Tea", price: 30, category: "Tea & Beverages" },
    { name: "Ginger Tea", price: 30, category: "Tea & Beverages" },
    { name: "Milk", price: 30, category: "Tea & Beverages" },
    { name: "Boost", price: 35, category: "Tea & Beverages" },
    { name: "Horlicks", price: 35, category: "Tea & Beverages" },
    { name: "Hot Badam", price: 35, category: "Tea & Beverages" },
    { name: "Black Coffee", price: 30, category: "Tea & Beverages" },
    { name: "Black Tea", price: 30, category: "Tea & Beverages" },

    // CURRIES
    { name: "Kadai Paneer", price: 189, category: "Curries" },
    { name: "Kadai Veg", price: 169, category: "Curries" },
    { name: "Kadai Mushroom", price: 169, category: "Curries" },
    { name: "Dal Tadka", price: 149, category: "Curries" },
    { name: "Dal Fry", price: 119, category: "Curries" },
    { name: "Butter Chicken", price: 199, category: "Curries" },
    { name: "Kadai Chicken", price: 199, category: "Curries" },
    { name: "Mutton Rogan Josh", price: 289, category: "Curries" },
    { name: "Prawn Masala", price: 269, category: "Curries" },
    { name: "Fish Masala", price: 249, category: "Curries" }
  ])

  console.log("✅ OG Restaurant Menu Seeded Successfully with categories")
  process.exit()
})