// Centralized env var reads. Fail fast at boot on missing secrets, same
// pattern db/pool.js already uses for DATABASE_URL.

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// Comma-separated list of allowed browser origins. Empty by default (deny all
// cross-origin requests) so a missing env var fails closed rather than open.
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = { JWT_SECRET, CORS_ALLOWED_ORIGINS };
