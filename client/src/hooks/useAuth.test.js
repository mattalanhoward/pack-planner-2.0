// src/hooks/useAuth.test.js

// Mock API import to avoid import.meta in tests
jest.mock("../services/api", () => ({ __esModule: true, default: {} }));
// Mock AuthContext to avoid parsing import.meta in contexts
jest.mock("../contexts/AuthContext", () => {
  const React = require("react");
  return { AuthContext: React.createContext() };
});

import React from "react";
import { render } from "@testing-library/react";
import useAuth from "./useAuth";
import { AuthContext } from "../contexts/AuthContext";

// Helper component to consume the useAuth hook
function Consumer() {
  const auth = useAuth();
  return <div data-testid="value">{JSON.stringify(auth)}</div>;
}

describe("useAuth hook", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("throws if used outside AuthProvider", () => {
    expect.assertions(1);
    try {
      render(<Consumer />);
    } catch (e) {
      expect(e.message).toBe("useAuth must be used within AuthProvider");
    }
  });

  it("returns context value when wrapped in AuthProvider", () => {
    const mockValue = { isAuthenticated: true, logout: jest.fn() };
    const { getByTestId } = render(
      <AuthContext.Provider value={mockValue}>
        <Consumer />
      </AuthContext.Provider>
    );
    expect(getByTestId("value").textContent).toBe(JSON.stringify(mockValue));
  });
});
