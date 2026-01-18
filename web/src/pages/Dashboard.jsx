// web/src/pages/Dashboard.jsx
//
// PURPOSE
// -------
// Main "Day 2" dashboard screen:
// - Loads current user (/me)
// - Loads KPI summary (/kpis/summary)
// - Loads daily revenue (/kpis/daily)
// - Loads top event types (/kpis/top)
//
// UI GOAL
// -------
// Clean, readable, not flashy. Looks like a real internal dashboard.

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { clearToken } from "../lib/auth.js";
import "../App.css";

/** Convert cents (integer) to a currency string. */
function money(cents) {
  const dollars = cents / 100;
  return dollars.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

/**
 * Tiny SVG line chart.
 * No dependencies. Good enough for an internship demo.
 */
function LineChart({ points }) {
  // If nothing to plot, show a friendly empty state.
  if (!points || points.length === 0) {
    return <div className="subtle">No data to plot.</div>;
  }

  // Extract x/y arrays for scaling.
  const ys = points.map((p) => p.revenue_cents);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Avoid divide-by-zero if all points are equal.
  const range = maxY - minY || 1;

  // Chart dimensions (simple fixed box).
  const W = 860;
  const H = 180;
  const pad = 12;

  // Convert a point index to x coordinate.
  const x = (i) => pad + (i * (W - pad * 2)) / (points.length - 1 || 1);

  // Convert revenue to y coordinate (SVG y goes downward).
  const y = (val) => {
    const t = (val - minY) / range; // 0..1
    return pad + (1 - t) * (H - pad * 2);
  };

  // Build SVG path: "M x0 y0 L x1 y1 ..."
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(p.revenue_cents).toFixed(2)}`)
    .join(" ");

  // Label: show min/max for quick context.
  const minLabel = money(minY);
  const maxLabel = money(maxY);

  return (
    <div className="chartWrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="subtle">Min: {minLabel}</div>
        <div className="subtle">Max: {maxLabel}</div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="180" aria-label="Daily revenue chart">
        {/* baseline grid line */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,0.12)" />

        {/* the revenue line */}
        <path d={d} fill="none" stroke="rgba(99,102,241,0.9)" strokeWidth="3" />

        {/* points */}
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={x(i)}
            cy={y(p.revenue_cents)}
            r="4"
            fill="rgba(255,255,255,0.85)"
            opacity="0.9"
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Simple bar list for "Top event types".
 * Shows type name, a bar scaled by max count, and count value.
 */
function TopTypes({ items }) {
  if (!items || items.length === 0) {
    return <div className="subtle">No top types available.</div>;
  }

  const max = Math.max(...items.map((x) => x.count)) || 1;

  return (
    <div className="topList">
      {items.map((it) => {
        const pct = Math.round((it.count / max) * 100);
        return (
          <div className="topRow" key={it.type}>
            <div style={{ fontWeight: 700 }}>{it.type}</div>

            <div className="bar" aria-label={`${it.type} bar`}>
              <div className="barFill" style={{ width: `${pct}%` }} />
            </div>

            <div style={{ textAlign: "right", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
              {it.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  // Who is logged in?
  const [me, setMe] = useState(null);

  // KPI payloads.
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [top, setTop] = useState([]);

  // UI state.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Derived: show admin label if role is admin.
  const isAdmin = me?.role === "admin";

  // Fetch everything in parallel when the page loads.
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [meRes, summaryRes, dailyRes, topRes] = await Promise.all([
          api.me(),
          api.summary(),
          api.daily(),
          api.top(),
        ]);

        if (!alive) return;

        setMe(meRes);
        setSummary(summaryRes);
        setDaily(dailyRes);
        setTop(topRes);
      } catch (e) {
        // If auth fails, log out and send back to login.
        // (The Protected route will redirect once token is cleared.)
        const msg = e?.message || "Failed to load dashboard";
        setError(msg);

        if (msg.toLowerCase().includes("authorization") || msg.toLowerCase().includes("token")) {
          clearToken();
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    // Cleanup avoids React warnings if the component unmounts during fetch.
    return () => {
      alive = false;
    };
  }, []);

  // Format daily points for chart.
  const chartPoints = useMemo(() => {
    // Ensure stable order by date.
    return [...daily].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [daily]);

  function onLogout() {
    clearToken();
    // Hard refresh so state resets cleanly.
    window.location.href = "/login";
  }

  // Loading state: keep it simple and readable.
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="cardBody">
            <div className="subtle">Loading dashboard…</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state: show message.
  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="cardBody">
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Couldn’t load dashboard</div>
            <div className="subtle">{error}</div>
            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={onLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard UI.
  return (
    <div className="container">
      <div className="card">
        {/* Top header row */}
        <div className="cardHeader">
          <div>
            <h1 className="h1">Dashboard</h1>
            <div className="subtle">
              {isAdmin ? "All users KPIs" : "My KPIs"} •{" "}
              <span className="pill">
                {me?.email} · {me?.role}
              </span>
            </div>
          </div>

          <button className="btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="cardBody">
          {/* KPI summary cards */}
          <div className="grid3" style={{ marginBottom: 14 }}>
            <div className="kpiCard">
              <div className="kpiLabel">Revenue</div>
              <div className="kpiValue">{money(summary?.revenue_cents ?? 0)}</div>
            </div>

            <div className="kpiCard">
              <div className="kpiLabel">Events</div>
              <div className="kpiValue">{summary?.event_count ?? 0}</div>
            </div>

            <div className="kpiCard">
              <div className="kpiLabel">Active users</div>
              <div className="kpiValue">{summary?.active_users ?? 0}</div>
            </div>
          </div>

          {/* Daily revenue chart */}
          <div style={{ marginTop: 18 }}>
            <div className="sectionTitle">Daily revenue (last 14 days)</div>
            <LineChart points={chartPoints} />
          </div>

          {/* Top event types */}
          <div style={{ marginTop: 18 }}>
            <div className="sectionTitle">Top event types</div>
            <TopTypes items={top} />
          </div>
        </div>
      </div>
    </div>
  );
}