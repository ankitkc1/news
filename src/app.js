require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const methodOverride = require("method-override");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");

const { connectDB } = require("./config/db");
const { attachUserToViews } = require("./middleware/auth");
const { categoriesNavMiddleware } = require("./middleware/categoriesNav");

const authRoutes = require("./routes/auth.routes");
const articleRoutes = require("./routes/article.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

(async () => {
  await connectDB(process.env.MONGODB_URI);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

  app.use(morgan("dev"));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(methodOverride("_method"));

  // ✅ Serve /public as root (clean URLs)
  app.use(express.static(path.join(__dirname, "..", "public")));

  // EJS + layouts
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(expressLayouts);
  app.set("layout", "layouts/main");

  // Sessions stored in MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,   // ✅ MUST be defined
      dbName: "e_news",                  // optional but ok
      collectionName: "sessions",
    }),
  })
);

  app.use(flash());

  app.use((req, res, next) => {
    res.locals.appName = process.env.APP_NAME || "News";
    res.locals.flash = {
      success: req.flash("success"),
      error: req.flash("error")
    };
    next();
  });

  app.use(attachUserToViews);

  // ✅ Categories in navbar (cached)
  app.use(categoriesNavMiddleware);

  // Routes
  app.use("/auth", authRoutes);
  app.use("/", articleRoutes);
  app.use("/admin", adminRoutes);

  app.use((req, res) => res.status(404).send("404 Not Found"));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
})();
