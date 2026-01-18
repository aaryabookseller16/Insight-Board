// api/src/middleware/requireAuth.js
//
// PURPOSE
// -------
// Express middleware that protects routes using JWT authentication.
//
// HOW IT WORKS
// ------------
// 1) Reads Authorization header: "Bearer <token>"
// 2) Verifies token signature with JWT_SECRET
// 3) Attaches decoded payload to req.user
// 4) Rejects request if token is missing/invalid/expired
//
// IMPORTANT
// ---------
// - This is the REAL access control gate for protected routes.
// - Frontend "Protected route" is just UX; backend is enforcement.

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // Expected header format: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  // If header missing, user is not authenticated.
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  // Split into ["Bearer", "<token>"]
  const [scheme, token] = authHeader.split(" ");

  // Validate format early to avoid weird edge cases.
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }

  try {
    // Verify signature + expiry; throws if invalid/expired.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user identity to request so routes can use req.user.id / req.user.role.
    req.user = payload;

    // Continue to the real route handler.
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };