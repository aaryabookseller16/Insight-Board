const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

// Tuned for a serverless deployment: each function instance should hold few
// connections since Neon's pooled (PgBouncer) connection string absorbs the
// fan-out across concurrent cold starts. Every query in this codebase uses
// unnamed, extended-protocol statements (no `pg` prepared-statement `name`),
// which is exactly what PgBouncer's transaction-pooling mode supports safely.
const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX) || 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
  query_timeout: 10_000,
});

module.exports = { pool };
