const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) { // every request to KPIs must pass through this gate
  // Expected header format:
  // Authorization: Bearer <token>
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    // Verify token signature + expiry
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request so downstream routes can use it
    // payload looks like: { id, email, role, iat, exp }
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    return next();
  } catch (err) {
    // Token could be expired, tampered with, or signed with a different secret
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

module.exports = { requireAuth };