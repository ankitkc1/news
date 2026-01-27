const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 800 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
