const path = require("path");

// Loaded before any test file's imports (via vitest's setupFiles), so
// config.js/db/pool.js see these values instead of falling through to
// whatever's in the developer's own .env (a different database).
require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });
