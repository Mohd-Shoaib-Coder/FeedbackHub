// ✅ 1. Imports
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();



// ✅ 2. Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");




// ✅ 3. MongoDB Connection (already simplified, good)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection failed:", err.message));





// ✅ 4. Routes
const testimonialRoutes = require("./routes/testimonialRoutes");
app.use("/", testimonialRoutes);





// ✅ 5. Redirect root (optional, but useful)
app.get("/", (req, res) => {
  res.redirect("/testimonials");

});




// ✅ 6. Port Setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
