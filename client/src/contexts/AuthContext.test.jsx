// src/contexts/AuthContext.test.jsx

// 1) MOCK '../services/api' so AuthContext never tries to parse import.meta.env
jest.mock("../services/api", () => ({
  post: jest.fn(),
  defaults: { headers: { common: {} } },
}));

import React, { useContext } from "react";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, AuthContext } from "./AuthContext";
import api from "../services/api";

// 2) A small component that directly consumes AuthContext (not useAuth)
function TestConsumer() {
  const { isAuthenticated, login, logout, loading } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="status">
        {loading ? "LOADING" : isAuthenticated ? "AUTH" : "NO_AUTH"}
      </span>
      <button
        onClick={() => login("alice@example.com", "secret")}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe("AuthContext / useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    api.defaults = { headers: { common: {} } };
  });

  test("initially not authenticated; login sets token; logout clears it", async () => {
    // Arrange: make api.post resolve with a token
    api.post.mockResolvedValueOnce({ data: { token: "XYZ123" } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // 1) Initially the status should be NO_AUTH
    expect(screen.getByTestId("status").textContent).toBe("NO_AUTH");

    // 2) Click "Login"
    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    // After login completes:
    expect(localStorage.getItem("token")).toBe("XYZ123");
    expect(api.defaults.headers.common.Authorization).toBe("Bearer XYZ123");
    expect(screen.getByTestId("status").textContent).toBe("AUTH");

    // 3) Click "Logout"
    act(() => {
      screen.getByTestId("logout-btn").click();
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
    expect(screen.getByTestId("status").textContent).toBe("NO_AUTH");
  });
});
