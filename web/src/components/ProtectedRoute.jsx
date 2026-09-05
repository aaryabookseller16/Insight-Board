import { Navigate } from "react-router-dom";
import { hasToken } from "../lib/auth.js";

export function ProtectedRoute({ children }) {
  return hasToken() ? children : <Navigate to="/login" replace />;
}
