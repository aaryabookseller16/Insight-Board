import { EmptyState } from "./EmptyState.jsx";

/**
 * Horizontal bar list for "top event types". Single-series (no legend
 * needed) — each row's own count is already a direct label, and the
 * `title` attribute gives a hover value without needing a custom tooltip.
 */
export function TopTypes({ items }) {
  if (!items || items.length === 0) {
    return <EmptyState>No event activity in this period yet.</EmptyState>;
  }

  const max = Math.max(...items.map((item) => item.count)) || 1;

  return (
    <div className="top-list">
      {items.map((item) => {
        const pct = Math.round((item.count / max) * 100);
        return (
          <div className="top-row" key={item.type} title={`${item.type}: ${item.count}`}>
            <div className="top-row-label">{item.type}</div>
            <div className="top-bar-track" aria-hidden="true">
              <div className="top-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="top-row-count">{item.count}</div>
          </div>
        );
      })}
    </div>
  );
}
