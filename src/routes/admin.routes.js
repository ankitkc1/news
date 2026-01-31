const express = require("express");
const { body, validationResult } = require("express-validator");
const slugify = require("slugify");
const sanitizeHtml = require("sanitize-html");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Article = require("../models/article");

const router = express.Router();

function cleanHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "blockquote"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt"],
      "*": ["style"]
    },
    allowedSchemes: ["http", "https", "data"]
  });
}

router.get("/", requireAdmin, async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.render("admin/dashboard", { articles });
});

router.get("/articles/new", requireAdmin, (req, res) => {
  res.render("admin/article-form", { mode: "create", article: null });
});

//Create with image upload: coverImageFile
router.post(
  "/articles",
  requireAdmin,
  upload.single("coverImageFile"),
  body("title").isLength({ min: 5, max: 180 }).trim(),
  body("excerpt").isLength({ min: 20, max: 400 }).trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map(e => e.msg).join(", "));
      return res.redirect("/admin/articles/new");
    }

    const { title, excerpt, contentHtml, category, tags } = req.body;

    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let i = 1;
    while (await Article.exists({ slug })) slug = `${baseSlug}-${i++}`;

    const safeHtml = cleanHtml(contentHtml || "");

    //If file uploaded, use it. Else allow URL field.
    const coverImageUrl =
      req.file ? `/uploads/${req.file.filename}` : (req.body.coverImageUrl || "").trim();

    await Article.create({
      title,
      slug,
      excerpt,
      contentHtml: safeHtml,
      category: (category || "General").trim(),
      tags: (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      coverImageUrl,
      author: req.session.user.id,
      published: true
    });

    req.flash("success", "Article published!");
    res.redirect("/admin");
  }
);

router.get("/articles/:id/edit", requireAdmin, async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) return res.status(404).send("Not found");
  res.render("admin/article-form", { mode: "edit", article });
});

//Update with image upload
router.put(
  "/articles/:id",
  requireAdmin,
  upload.single("coverImageFile"),
  body("title").isLength({ min: 5, max: 180 }).trim(),
  body("excerpt").isLength({ min: 20, max: 400 }).trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map(e => e.msg).join(", "));
      return res.redirect(`/admin/articles/${req.params.id}/edit`);
    }

    const { title, excerpt, contentHtml, category, tags, published } = req.body;

    const safeHtml = cleanHtml(contentHtml || "");

  const update = {
    title,
    excerpt,
    contentHtml: safeHtml,
    category: (category || "General").trim(),
    tags: (tags || "").split(",").map(t => t.trim()).filter(Boolean),
  };

  //only change published if the form sent it
  if (typeof published !== "undefined") {
    update.published = (published === "true" || published === "on");
  }

    // Replace image if new file uploaded, else allow URL field update
    if (req.file) update.coverImageUrl = `/uploads/${req.file.filename}`;
    else if (typeof req.body.coverImageUrl === "string") update.coverImageUrl = req.body.coverImageUrl.trim();

    await Article.findByIdAndUpdate(req.params.id, update);

    req.flash("success", "Article updated.");
    res.redirect("/admin");
  }
);

router.delete("/articles/:id", requireAdmin, async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  req.flash("success", "Article deleted.");
  res.redirect("/admin");
});

module.exports = router;
