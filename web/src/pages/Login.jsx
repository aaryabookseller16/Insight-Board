// web/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { setToken } from "../lib/auth.js";
import { Card, CardBody } from "../components/Card.jsx";
import { Button } from "../components/Button.jsx";
import { Field, Input } from "../components/Input.jsx";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="page-centered">
      <Card style={{ width: "min(400px, 100%)" }}>
        <CardBody className="stack">
          <div>
            <h1 className="title" style={{ fontSize: "22px" }}>
              InsightBoard
            </h1>
            <p className="subtitle">Sign in to view your KPIs</p>
          </div>

          <form onSubmit={onSubmit} className="stack" noValidate>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            {error ? (
              <p className="error-text" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
