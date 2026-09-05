const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { JWT_SECRET } = require("../config");
const { credentialsSchema } = require("../validation/schemas");

const router = express.Router();

// Hashed once at startup and compared against on every failed lookup in
// /login, so response timing doesn't reveal whether an email is registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "insightboard-timing-safety-constant",
  10
);

router.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "email and password required" });
  }

  // Force email to lowercase so duplicates like A@B.com vs a@b.com don't happen
  const normalizedEmail = parsed.data.email.toLowerCase();
  const { password } = parsed.data;

  try {
    // Hash password before storing (never store plaintext passwords)
    const password_hash = await bcrypt.hash(password, 10);

    // Role is always 'user' here — there is no self-service path to admin.
    // Admin accounts are provisioned only via db/seed.sql or direct SQL.
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'user')
       RETURNING id, email, role, created_at`,
      [normalizedEmail, password_hash]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    // 23505 = unique_violation (Postgres SQLSTATE), robust to constraint
    // renames unlike matching on the error message text.
    if (err.code === "23505") {
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
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "email and password required" });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const { password } = parsed.data;

  try {
    // Fetch user record by email
    const result = await pool.query(
      `SELECT id, email, role, password_hash
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Always run bcrypt.compare — even when the user doesn't exist — against
    // a fixed dummy hash, so a nonexistent email doesn't return faster than a
    // wrong password would.
    const ok = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_PASSWORD_HASH
    );

    if (!user || !ok) {
      // Don't reveal whether email exists — generic failure message
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT payload (keep it minimal)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Sign token (expires in 2 hours)
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "2h"
    });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
