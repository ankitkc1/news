function attachUserToViews(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.isLoggedIn = !!req.session.user;
  res.locals.isAdmin = req.session.user?.role === "admin";
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Please login to continue.");
    return res.redirect("/auth/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user?.role !== "admin") {
    req.flash("error", "Admins only.");
    return res.redirect("/");
  }
  next();
}

module.exports = { attachUserToViews, requireAuth, requireAdmin };
