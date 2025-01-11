const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user/userRoute");
const adminRoutes = require("./routes/admin/adminRoute");
const path = require("path");
const fs = require("fs");
const passport = require("./config/passport")

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session())

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


app.use("/", userRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

// app.get("/", (req, res) => {
//   res.send("hello");
// });

// Set view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
