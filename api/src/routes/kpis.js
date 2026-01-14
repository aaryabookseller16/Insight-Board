const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

/**
 * GET /kpis/summary
 *
 * Returns high-level metrics.
 * - Admin: metrics across all users
 * - User: metrics for their own data only
 */
router.get("/summary", async (req, res) => {
  const isAdmin = req.user.role === "admin";

  // If admin → no WHERE clause
  // If user → restrict to their user_id
  const whereClause = isAdmin ? "" : "WHERE user_id = $1";
  const params = isAdmin ? [] : [req.user.id];

  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS event_count,
        COUNT(DISTINCT user_id)::int AS active_users,
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount_cents ELSE 0 END), 0)::int AS sales_cents,
        COALESCE(SUM(CASE WHEN type = 'refund' THEN amount_cents ELSE 0 END), 0)::int AS refunds_cents
      FROM events
      ${whereClause}
      `,
      params
    );

    const row = result.rows[0];

    const revenue_cents = row.sales_cents - row.refunds_cents;

    return res.json({
      event_count: row.event_count,
      active_users: row.active_users,
      revenue_cents
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to compute KPIs" });
  }
});

module.exports = router;