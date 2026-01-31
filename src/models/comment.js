const mongoose = require("mongoose");
//Mongoose model for comments.  used to store and fetch comments in MongoDB, and link each comment to a specific article and user
const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 800 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
