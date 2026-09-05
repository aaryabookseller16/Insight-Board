// web/src/pages/Dashboard.jsx
//
// Main dashboard screen: loads /me, /kpis/summary, /kpis/daily, /kpis/top
// and renders the KPI cards, revenue chart, and top-event-types list.

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { clearToken } from "../lib/auth.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { StatTile } from "../components/StatTile.jsx";
import { LineChart } from "../components/LineChart.jsx";
import { TopTypes } from "../components/TopTypes.jsx";

function money(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [top, setTop] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = me?.role === "admin";

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
        if (!alive) return;

        setError(e?.message || "Failed to load dashboard");

        // A 401 means the token is missing/expired/invalid — clear it so
        // the Protected route redirects to /login on next render, rather
        // than guessing from the error message text.
        if (e?.status === 401) {
          clearToken();
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const chartPoints = useMemo(() => {
    return [...daily].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [daily]);

  function onLogout() {
    clearToken();
    // Hard navigation so app state resets cleanly on the next load.
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="page">
        <Card>
          <CardBody>
            <span className="text-muted">Loading dashboard…</span>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <Card>
          <CardBody>
            <p className="title" style={{ fontSize: "18px" }}>
              Couldn't load dashboard
            </p>
            <p className="text-muted text-sm">{error}</p>
            <div style={{ marginTop: "16px" }}>
              <Button onClick={onLogout}>Log out</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page stack">
      <Card>
        <CardHeader>
          <div className="row">
            <div>
              <h1 className="title">Dashboard</h1>
              <p className="subtitle">
                {isAdmin ? "All users' KPIs" : "Your KPIs"}{" "}
                <span className="pill">
                  {me?.email} · {me?.role}
                </span>
              </p>
            </div>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </CardHeader>

        <CardBody className="stack">
          <div className="stat-grid">
            <StatTile label="Revenue" value={money(summary?.revenue_cents ?? 0)} />
            <StatTile label="Events" value={summary?.event_count ?? 0} />
            <StatTile
              label={isAdmin ? "Active users" : "Active days"}
              value={isAdmin ? summary?.active_users ?? 0 : summary?.active_days ?? 0}
            />
          </div>

          <div>
            <p className="section-title">Daily revenue (last 14 days)</p>
            <LineChart points={chartPoints} />
          </div>

          <div>
            <p className="section-title">Top event types</p>
            <TopTypes items={top} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
