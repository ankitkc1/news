const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");

const router = express.Router();
//register the user and authentcation
router.get("/register", (req, res) => res.render("auth/register"));

router.post(
  "/register",
  body("name").isLength({ min: 2 }).trim(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map(e => e.msg).join(", "));
      return res.redirect("/auth/register");
    }

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash("error", "Email already registered.");
      return res.redirect("/auth/register");
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({ name, email, passwordHash, role: "user" });
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };

    req.flash("success", "Welcome! Your account is created.");
    res.redirect("/");
  }
);

router.get("/login", (req, res) => res.render("auth/login"));

router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/auth/login");
    }

    const ok = await user.verifyPassword(password);
    if (!ok) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/auth/login");
    }

    req.session.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    req.flash("success", `Welcome back, ${user.name}!`);
    res.redirect("/");
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
