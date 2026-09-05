const rateLimit = require("express-rate-limit");

// Applied only to /auth/* — register/login are the credential-stuffing and
// registration-spam surface; the KPI/me routes are already gated by JWT.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

module.exports = { authLimiter };
