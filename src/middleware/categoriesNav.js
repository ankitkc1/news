const Article = require("../models/article");

let cache = { categories: [], expiresAt: 0 };
//get categoroes in the nav bar with the maximum of 8
async function categoriesNavMiddleware(req, res, next) {
  try {
    const now = Date.now();
    if (now > cache.expiresAt) {
      const cats = await Article.aggregate([
        { $match: { published: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 }
      ]);

      cache.categories = cats
        .map(x => x._id)
        .filter(Boolean);

      cache.expiresAt = now + 5 * 60 * 1000; // 5 min
    }

    res.locals.navCategories = cache.categories;
    next();
  } catch (e) {
    res.locals.navCategories = [];
    next();
  }
}

module.exports = { categoriesNavMiddleware };
