import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";
import { api } from "../lib/api.js";
import { setToken } from "../lib/auth.js";

vi.mock("../lib/api.js", () => ({
  api: { login: vi.fn() },
}));

vi.mock("../lib/auth.js", () => ({
  setToken: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Login", () => {
  it("submits the typed email and password", async () => {
    api.login.mockResolvedValue({ token: "abc123" });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "admin123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith("admin@example.com", "admin123");
    });
  });

  it("stores the token and navigates away on success", async () => {
    api.login.mockResolvedValue({ token: "abc123" });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "admin123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith("abc123");
    });
  });

  it("shows an error message when login fails", async () => {
    api.login.mockRejectedValue(new Error("Invalid credentials"));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(setToken).not.toHaveBeenCalled();
  });
});
