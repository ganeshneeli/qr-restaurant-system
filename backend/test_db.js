const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./src/models/User');
    const u = await User.findById('69a6ed550aa1558f54085699');
    console.log("User 69a6ed550aa1558f54085699:", u);
    process.exit(0);
});
