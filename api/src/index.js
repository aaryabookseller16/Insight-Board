const express = require("express");
const cors = require("cors");

// Loads environment variables from a .env file when running locally.
// In Docker, env vars come from docker-compose.yml, so this is harmless.
require("dotenv").config();

const authRoutes = require("./routes/auth");
const meRouter = require("./routes/me");
const kpisRouter = require("./routes/kpis");

// JWT auth middleware used to protect routes
const { requireAuth } = require("./middleware/requireAuth");

const app = express();

// Middleware: allow JSON request bodies (req.body)
app.use(express.json());

// Middleware: allows browser apps (React) to call this API from another origin
app.use(cors());

// Simple health check so you can confirm the server is alive
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Auth routes do NOT require authentication
app.use("/auth", authRoutes);

// /me route returns the current user (JWT payload). Protected by JWT.
app.use("/me", requireAuth, meRouter);

// KPI routes require authentication
app.use("/kpis", requireAuth, kpisRouter);

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});