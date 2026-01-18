// web/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

export default function Login() {
  const nav = useNavigate();

  // Controlled inputs so UI always reflects state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await api.login(email, password);
      setToken(token);
      nav("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", minHeight: "90vh" }}>
      <div className="card" style={{ width: "min(440px, 100%)" }}>
        <div className="cardBody">
          <div style={{ marginBottom: 12 }}>
            <h1 className="h1">InsightBoard</h1>
            <p className="h2">Sign in to view your KPIs</p>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 13 }}>Email</span>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 13 }}>Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <button className={`btn btnPrimary`} disabled={loading} style={{ marginTop: 6 }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {error ? <div className="error">{error}</div> : null}

            <div className="hr" />

            <div className="muted" style={{ fontSize: 13 }}>
              Tip: use your seeded users (admin + 2 users).
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}