import { useState } from "react";
import { EmptyState } from "./EmptyState.jsx";

const WIDTH = 860;
const HEIGHT = 220;
const PAD = 28;

function money(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Single-series revenue-over-time line. No charting library: a hand-rolled
 * SVG path, a hover crosshair + tooltip, and a visually-hidden data table so
 * the same values are reachable without hovering (screen readers included).
 */
export function LineChart({ points }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!points || points.length === 0) {
    return <EmptyState>No revenue data for this period yet.</EmptyState>;
  }

  const values = points.map((p) => p.revenue_cents);
  const minY = Math.min(...values, 0);
  const maxY = Math.max(...values, 0);
  const range = maxY - minY || 1;

  const x = (i) => PAD + (i * (WIDTH - PAD * 2)) / (points.length - 1 || 1);
  const y = (val) => {
    const t = (val - minY) / range;
    return PAD + (1 - t) * (HEIGHT - PAD * 2);
  };

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(p.revenue_cents).toFixed(2)}`)
    .join(" ");

  const zeroY = y(0);
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function onMove(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(x(i) - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="chart-card">
      <div className="chart-legend-row">
        <span className="text-sm text-muted">Min {money(minY)}</span>
        <span className="text-sm text-muted">Max {money(maxY)}</span>
      </div>

      <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Daily revenue over the last 14 days"
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <title>Daily revenue over the last 14 days</title>

        {/* zero baseline, hairline */}
        <line
          x1={PAD}
          y1={zeroY}
          x2={WIDTH - PAD}
          y2={zeroY}
          stroke="var(--baseline)"
          strokeWidth="1"
        />

        {/* the revenue line */}
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* hover crosshair */}
        {hovered && (
          <line
            x1={x(hoverIndex)}
            y1={PAD}
            x2={x(hoverIndex)}
            y2={HEIGHT - PAD}
            stroke="var(--baseline)"
            strokeWidth="1"
          />
        )}

        {/* endpoint marker: >=8px, filled with the series color, ringed in the surface color */}
        <circle
          cx={x(points.length - 1)}
          cy={y(last.revenue_cents)}
          r="4"
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth="2"
        />

        {hovered && (
          <circle
            cx={x(hoverIndex)}
            cy={y(hovered.revenue_cents)}
            r="4"
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        )}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(x(hoverIndex) / WIDTH) * 100}%`,
            top: `${(y(hovered.revenue_cents) / HEIGHT) * 100}%`,
          }}
        >
          {formatDate(hovered.date)} · <strong>{money(hovered.revenue_cents)}</strong>
        </div>
      )}
      </div>

      <table className="sr-only">
        <caption>Daily revenue, last 14 days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{formatDate(p.date)}</td>
              <td>{money(p.revenue_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
