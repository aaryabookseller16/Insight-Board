import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { hasToken } from "../lib/auth.js";

vi.mock("../lib/auth.js", () => ({
  hasToken: vi.fn(),
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Dashboard content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no token", () => {
    hasToken.mockReturnValue(false);
    renderAt("/");
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the protected content when a token is present", () => {
    hasToken.mockReturnValue(true);
    renderAt("/");
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
