import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard.jsx";
import { api } from "../lib/api.js";
import { clearToken } from "../lib/auth.js";

vi.mock("../lib/api.js", () => ({
  api: { me: vi.fn(), summary: vi.fn(), daily: vi.fn(), top: vi.fn() },
}));

vi.mock("../lib/auth.js", () => ({
  clearToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("shows a loading state before the API calls resolve", () => {
    api.me.mockReturnValue(new Promise(() => {}));
    api.summary.mockReturnValue(new Promise(() => {}));
    api.daily.mockReturnValue(new Promise(() => {}));
    api.top.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("clears the token and shows an error when a call 401s", async () => {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    api.me.mockRejectedValue(err);
    api.summary.mockResolvedValue({});
    api.daily.mockResolvedValue([]);
    api.top.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load dashboard/i)).toBeInTheDocument();
    });
    expect(clearToken).toHaveBeenCalled();
  });

  it("renders empty states when there is no data yet", async () => {
    api.me.mockResolvedValue({ id: 1, email: "user1@example.com", role: "user" });
    api.summary.mockResolvedValue({ event_count: 0, revenue_cents: 0, active_days: 0 });
    api.daily.mockResolvedValue([]);
    api.top.mockResolvedValue([]);

    render(<Dashboard />);

    expect(await screen.findByText(/no revenue data/i)).toBeInTheDocument();
    expect(screen.getByText(/no event activity/i)).toBeInTheDocument();
  });

  it("renders KPI values, chart, and top types for a populated account", async () => {
    api.me.mockResolvedValue({ id: 2, email: "admin@example.com", role: "admin" });
    api.summary.mockResolvedValue({ event_count: 4, revenue_cents: 12500, active_users: 2 });
    api.daily.mockResolvedValue([
      { date: "2026-08-01", revenue_cents: 1000 },
      { date: "2026-08-02", revenue_cents: 2500 },
    ]);
    api.top.mockResolvedValue([{ type: "sale", count: 3 }]);

    render(<Dashboard />);

    expect(await screen.findByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // active_users
    expect(screen.getByRole("img", { name: /daily revenue/i })).toBeInTheDocument();
    expect(screen.getByText("sale")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com · admin", { exact: false })).toBeInTheDocument();
  });
});
