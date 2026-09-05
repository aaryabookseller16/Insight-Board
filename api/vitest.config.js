const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.js"],
    hookTimeout: 20_000,
    testTimeout: 20_000,
    // All test files share one Postgres test database via TRUNCATE-based
    // fixtures — running files in parallel races their resetDb() calls
    // against each other.
    fileParallelism: false,
  },
});
