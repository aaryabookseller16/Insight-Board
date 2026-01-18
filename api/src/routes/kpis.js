// api/src/routes/kpis.js
//
// PURPOSE
// -------
// KPI endpoints for InsightBoard dashboard.
// - summary: cards
// - daily: time series chart
// - top: top event types list
//
// SECURITY
// --------
// All endpoints require JWT auth via requireAuth.
// RBAC:
// - admin: sees data across ALL users
// - user: sees ONLY their own events (scoped by user_id)
//
// DATA MODEL ASSUMPTIONS
// ----------------------
// events table columns used here:
// - user_id (int)
// - type (text)          e.g. "sale", "refund", "chargeback"
// - amount_cents (int)   money in cents (avoid float money bugs)
// - created_at (timestamp)

const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

/**
 * buildScope(req.user)
 *
 * Returns WHERE clause + parameter list based on role.
 * - admin: no scope (all rows)
 * - user: scope to their user_id
 */
function buildScope(user) {
  const isAdmin = user.role === "admin";
  return {
    isAdmin,
    whereSql: isAdmin ? "" : "WHERE e.user_id = $1",
    params: isAdmin ? [] : [user.id],
  };
}

/**
 * GET /kpis/summary
 *
 * Returns:
 * - event_count
 * - revenue_cents (sales - refunds)
 * - admin: active_users (distinct users in events)
 * - user:  active_days  (distinct days with events for that user)
 */
router.get("/summary", requireAuth, async (req, res) => {
  const { isAdmin, whereSql, params } = buildScope(req.user);

  try {
    // Base summary: counts + sales/refunds totals (scoped)
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS event_count,
        COALESCE(SUM(CASE WHEN e.type = 'sale' THEN e.amount_cents ELSE 0 END), 0)::int AS sales_cents,
        COALESCE(SUM(CASE WHEN e.type = 'refund' THEN e.amount_cents ELSE 0 END), 0)::int AS refunds_cents
      FROM events e
      ${whereSql};
      `,
      params
    );

    const row = result.rows[0];
    const revenue_cents = row.sales_cents - row.refunds_cents;

    if (isAdmin) {
      // Admin-only metric: how many distinct users generated events
      const au = await pool.query(
        `SELECT COUNT(DISTINCT user_id)::int AS active_users FROM events;`
      );

      return res.json({
        event_count: row.event_count,
        revenue_cents,
        active_users: au.rows[0].active_users,
      });
    } else {
      // User-only metric: how many distinct days this user was active
      const ad = await pool.query(
        `
        SELECT COUNT(DISTINCT DATE(created_at))::int AS active_days
        FROM events
        WHERE user_id = $1;
        `,
        [req.user.id]
      );

      return res.json({
        event_count: row.event_count,
        revenue_cents,
        active_days: ad.rows[0].active_days,
      });
    }
  } catch (err) {
    console.error("GET /kpis/summary error:", err);
    return res.status(500).json({ error: "Failed to compute KPIs" });
  }
});

/**
 * GET /kpis/daily
 *
 * Returns daily revenue for last 14 days:
 *   [{ date: '2026-01-10', revenue_cents: 12345 }, ...]
 *
 * Frontend can divide by 100 to display dollars.
 */
router.get("/daily", requireAuth, async (req, res) => {
  const { whereSql, params } = buildScope(req.user);

  try {
    // We want the last 14 days for both admin and user.
    const timeFilter = `e.created_at >= NOW() - INTERVAL '14 days'`;

    // If already scoped by user_id, append AND. Otherwise start WHERE.
    const finalWhere = whereSql
      ? `${whereSql} AND ${timeFilter}`
      : `WHERE ${timeFilter}`;

    const result = await pool.query(
      `
      SELECT
        DATE(e.created_at) AS date,
        COALESCE(SUM(
          CASE
            WHEN e.type = 'sale' THEN e.amount_cents
            WHEN e.type = 'refund' THEN -e.amount_cents
            ELSE 0
          END
        ), 0)::int AS revenue_cents
      FROM events e
      ${finalWhere}
      GROUP BY 1
      ORDER BY 1;
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("GET /kpis/daily error:", err);
    return res.status(500).json({ error: "Failed to compute daily KPIs" });
  }
});

/**
 * GET /kpis/top
 *
 * Returns top 5 event types by count:
 *   [{ type: 'sale', count: 210 }, ...]
 */
router.get("/top", requireAuth, async (req, res) => {
  const { whereSql, params } = buildScope(req.user);

  try {
    const result = await pool.query(
      `
      SELECT
        e.type,
        COUNT(*)::int AS count
      FROM events e
      ${whereSql}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 5;
      `,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("GET /kpis/top error:", err);
    return res.status(500).json({ error: "Failed to compute top KPIs" });
  }
});

module.exports = router;