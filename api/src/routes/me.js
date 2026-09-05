const express = require("express");

const router = express.Router();

// requireAuth is applied once, at the mount point in index.js — no need to
// re-apply it per route.
router.get("/", (req, res) => {
  // req.user comes from requireAuth middleware
  return res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

module.exports = router;
