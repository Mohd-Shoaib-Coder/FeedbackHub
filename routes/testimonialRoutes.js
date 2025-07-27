const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");

// Show form to submit feedback
router.get("/submit", (req, res) => {
  res.render("submit", { error: null });
});

// Handle form submission
router.post("/submit", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.render("submit", { error: "All fields are required." });
  }

  try {
    const testimonial = new Testimonial({ name, email, message });
    await testimonial.save();
    res.redirect("/testimonials");
  } catch (error) {
    res.status(500).send("Error saving testimonial");
  }
});

// Show all testimonials
router.get("/testimonials", async (req, res) => {
  const testimonials = await Testimonial.find().sort({ createdAt: -1 });
  res.render("testimonials", { testimonials });
});

// Show individual testimonial
router.get("/testimonial/:id", async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).send("Not found");
    res.render("singleTestimonial", { testimonial });
  } catch (err) {
    res.status(500).send("Error loading testimonial");
  }
});

module.exports = router;
