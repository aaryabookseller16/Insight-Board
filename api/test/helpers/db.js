const bcrypt = require("bcrypt");
const { pool } = require("../../src/db/pool");

// Uses Node's own bcrypt (already a runtime dependency) rather than
// pgcrypto's crypt()/gen_salt() — keeps the test suite independent of
// whichever Postgres build it runs against (some local/embedded builds don't
// ship the pgcrypto extension; db/seed.sql is the only thing that needs it).
async function resetDb() {
  await pool.query("TRUNCATE TABLE events RESTART IDENTITY");
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
}

async function createUser({ email, password, role = "user" }) {
  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, role`,
    [email, password_hash, role]
  );
  return result.rows[0];
}

async function createEvent({ userId, type, amountCents = 0, createdAt }) {
  await pool.query(
    `INSERT INTO events (user_id, type, amount_cents, created_at)
     VALUES ($1, $2, $3, COALESCE($4, NOW()))`,
    [userId, type, amountCents, createdAt || null]
  );
}

module.exports = { resetDb, createUser, createEvent, pool };
