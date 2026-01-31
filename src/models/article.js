const mongoose = require("mongoose");

//defines the structure and gives you functions to save/fetch/update
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    contentHtml: { type: String, required: true },

    coverImageUrl: { type: String, default: "" },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    tags: [{ type: String, trim: true }],
    category: { type: String, trim: true, default: "General" },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },   //display the views
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
