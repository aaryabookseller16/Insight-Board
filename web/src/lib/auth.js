// web/src/lib/auth.js
//
// PURPOSE
// -------
// Tiny helper utilities for managing the JWT token in the browser.
//
// WHY THIS EXISTS
// ---------------
// - We want one consistent way to store / read / clear auth state.
// - LocalStorage is enough for this project (simple demo).
//
// SECURITY NOTE
// -------------
// Storing JWT in localStorage is not the most secure option in real apps
// (XSS risk). For InsightBoard demo, it's fine.
// The backend is still the source of truth: it verifies the JWT on every request.

const TOKEN_KEY = "insightboard_token";

/**
 * setToken(token)
 *
 * Stores the JWT so future API calls can authenticate.
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * getToken()
 *
 * Reads the stored JWT (or null if missing).
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * hasToken()
 *
 * Convenience boolean for "is someone logged in?"
 * (Note: doesn't validate token expiry; backend will enforce that.)
 */
export function hasToken() {
  return Boolean(getToken());
}

/**
 * clearToken()
 *
 * Logs out client-side by removing the token.
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}