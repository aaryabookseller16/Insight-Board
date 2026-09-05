// web/src/lib/api.js
//
// PURPOSE
// -------
// Central place for ALL frontend → backend requests.
//
// WHY THIS EXISTS
// ---------------
// - Keeps fetch logic (base URL, headers, error handling) consistent.
// - Automatically attaches the JWT token to protected endpoints.
// - Prevents copy/pasting fetch() everywhere.
//
// HOW TO USE
// ----------
// import { api } from "../lib/api";
// const me = await api.me();
//
// IMPORTANT
// ---------
// This file does NOT "secure" anything.
// Security happens on the backend via requireAuth middleware.
// This file just sends the Authorization header when we have a token.

import { getToken } from "./auth.js";

// In dev with Docker Compose, your backend is usually on localhost:3001 or similar.
// Set this to match your actual backend port.
// If you use Vite proxy, you can set BASE_URL = "" and fetch("/kpis/summary") etc.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * request(path, options)
 *
 * Minimal fetch wrapper that:
 * - Adds JSON headers
 * - Adds Authorization: Bearer <token> when available
 * - Converts non-2xx responses into a thrown Error with a readable message
 */
async function request(path, options = {}) {
  const token = getToken();

  // Default headers for JSON APIs.
  // We merge with any custom headers the caller passes.
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // If we have a token, attach it.
  // Backend expects: Authorization: Bearer <token>
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Try to parse JSON response (even for error cases).
  // If parsing fails, we fallback to a generic message.
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // If response is not OK (e.g. 401, 500), throw a helpful error. Callers
  // that need to react to auth failures specifically should check
  // `err.status === 401` rather than matching on the message text.
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

/**
 * api
 *
 * Small typed(ish) client around our backend routes.
 * Keep endpoints grouped and named clearly so it stays maintainable.
 */
export const api = {
  // Auth. No register() here — InsightBoard accounts are provisioned via
  // db/seed.sql or direct SQL, not self-service (see api/src/routes/auth.js).
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // User
  me() {
    return request("/me", { method: "GET" });
  },

  // KPIs
  summary() {
    return request("/kpis/summary", { method: "GET" });
  },

  daily() {
    return request("/kpis/daily", { method: "GET" });
  },

  top() {
    return request("/kpis/top", { method: "GET" });
  },
};