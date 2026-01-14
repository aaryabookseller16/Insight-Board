const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body || {};

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  // Force email to lowercase so duplicates like A@B.com vs a@b.com don't happen
  const normalizedEmail = email.toLowerCase().trim();

  // Safety: default role to user. Only allow 'admin' if explicitly passed.
  const safeRole = role === "admin" ? "admin" : "user";

  try {
    // Hash password before storing (never store plaintext passwords)
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [normalizedEmail, password_hash, safeRole]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    // Unique constraint violation for email
    if (String(err).includes("users_email_key")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /auth/login
 * Body: { email, password }
 *
 * Verifies user credentials and returns a signed JWT.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Fetch user record by email
    const result = await pool.query(
      `SELECT id, email, role, password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];
    if (!user) {
      // Don’t reveal whether email exists — generic failure message
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare plaintext password to stored bcrypt hash
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT payload (keep it minimal)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Sign token (expires in 2 hours)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h"
    });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;