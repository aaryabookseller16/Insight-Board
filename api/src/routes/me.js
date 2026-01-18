const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  // req.user comes from requireAuth middleware
  return res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

module.exports = router;