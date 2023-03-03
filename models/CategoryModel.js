const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  category: {
    type: String,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
