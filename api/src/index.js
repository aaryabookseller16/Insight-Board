const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// Loads environment variables from a .env file when running locally.
// In Docker, env vars come from docker-compose.yml, so this is harmless.
require("dotenv").config();

// Importing this fails fast at boot if JWT_SECRET is missing, the same way
// db/pool.js already fails fast on a missing DATABASE_URL.
const { CORS_ALLOWED_ORIGINS } = require("./config");

const authRoutes = require("./routes/auth");
const meRouter = require("./routes/me");
const kpisRouter = require("./routes/kpis");

// JWT auth middleware used to protect routes
const { requireAuth } = require("./middleware/requireAuth");
const { authLimiter } = require("./middleware/rateLimit");

const app = express();

app.use(helmet());

// Middleware: allow JSON request bodies (req.body), capped well above any
// real request this API expects.
app.use(express.json({ limit: "100kb" }));

// Middleware: allows browser apps (React) to call this API from another
// origin. Explicit allowlist via CORS_ALLOWED_ORIGINS — empty/unset denies
// all cross-origin requests rather than defaulting open.
app.use(cors({ origin: CORS_ALLOWED_ORIGINS }));

// Simple health check so you can confirm the server is alive
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Auth routes do NOT require authentication, but are rate-limited against
// brute-force/credential-stuffing and registration spam.
app.use("/auth", authLimiter, authRoutes);

// /me route returns the current user (JWT payload). Protected by JWT.
app.use("/me", requireAuth, meRouter);

// KPI routes require authentication
app.use("/kpis", requireAuth, kpisRouter);

// Start a listening server only when run directly (local dev, Docker, tests
// that spawn the process). When imported — by Vercel's serverless wrapper, or
// by supertest — the exported `app` is used directly without ever binding a
// port.
const port = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}

module.exports = app;
