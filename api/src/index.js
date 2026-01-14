const express = require("express");
const cors = require("cors");

// Loads environment variables from a .env file when running locally.
// In Docker, env vars come from docker-compose.yml, so this is harmless.
require("dotenv").config();

const authRoutes = require("./routes/auth");
const kpiRoutes = require("./routes/kpis");
const { requireAuth } = require("./middleware/auth");

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

// Example protected route: returns the decoded JWT payload
app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// KPI routes DO require authentication (enforced by the middleware)
app.use("/kpis", requireAuth, kpiRoutes);

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});