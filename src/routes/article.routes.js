const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Article = require("../models/Article");
const Comment = require("../models/Comment");

const router = express.Router();

function getPage(req) {
  const p = parseInt(req.query.page || "1", 10);
  return Number.isFinite(p) && p > 0 ? p : 1;
}

// ✅ Home: featured + latest
router.get("/", async (req, res) => {
  const latest = await Article.find({ published: true })
    .sort({ createdAt: -1 })
    .limit(18)
    .populate("author", "name");

  const trending = await Article.find({ published: true })
    .sort({ views: -1, createdAt: -1 })
    .limit(6)
    .select("title slug coverImageUrl category createdAt views likes");

  res.render("articles/index", { latest, trending });
});

// ✅ Categories list page with counts
router.get("/categories", async (req, res) => {
  const rows = await Article.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } }
  ]);

  res.render("articles/categories", { rows });
});

// ✅ Category page (with pagination)
router.get("/category/:category", async (req, res) => {
  const category = req.params.category;
  const page = getPage(req);
  const limit = 12;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Article.find({ published: true, category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name"),
    Article.countDocuments({ published: true, category })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.render("articles/category", { category, items, page, totalPages });
});

// ✅ Trending page (views + likes)
router.get("/trending", async (req, res) => {
  // last 30 days trending feels “news-like”
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const articles = await Article.aggregate([
    { $match: { published: true, createdAt: { $gte: since } } },
    { $addFields: { likesCount: { $size: "$likes" } } },
    { $sort: { views: -1, likesCount: -1, createdAt: -1 } },
    { $limit: 30 }
  ]);

  res.render("articles/trending", { articles });
});

// ✅ View article (paywall stays)
router.get("/news/:slug", async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, published: true }).populate("author", "name");
  if (!article) return res.status(404).send("Article not found");

  // ✅ View counter (avoid repeating within same session)
  req.session.viewedSlugs = req.session.viewedSlugs || [];
  if (!req.session.viewedSlugs.includes(article.slug)) {
    req.session.viewedSlugs.push(article.slug);
    await Article.updateOne({ _id: article._id }, { $inc: { views: 1 } });
    article.views += 1;
  }

  const comments = await Comment.find({ article: article._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name");

  const userId = req.session.user?.id;
  const hasLiked = userId ? article.likes.some(id => id.toString() === userId) : false;

  res.render("articles/show", { article, comments, hasLiked });
});

// Like/unlike
router.post("/news/:slug/like", requireAuth, async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, published: true });
  if (!article) return res.status(404).send("Article not found");

  const userId = req.session.user.id;
  const already = article.likes.some(id => id.toString() === userId);

  if (already) article.likes = article.likes.filter(id => id.toString() !== userId);
  else article.likes.push(userId);

  await article.save();
  res.redirect(`/news/${article.slug}`);
});

// Comment
router.post("/news/:slug/comments", requireAuth, async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, published: true });
  if (!article) return res.status(404).send("Article not found");

  const text = (req.body.text || "").trim();
  if (!text) {
    req.flash("error", "Comment cannot be empty.");
    return res.redirect(`/news/${article.slug}`);
  }

  await Comment.create({ article: article._id, user: req.session.user.id, text });
  req.flash("success", "Comment posted.");
  res.redirect(`/news/${article.slug}`);
});

module.exports = router;
