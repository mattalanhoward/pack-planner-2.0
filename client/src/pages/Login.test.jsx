/**
 * __tests__/Login.test.jsx
 *
 * Tests for the Login component:
 * - Renders inputs and button correctly
 * - Updates email and password fields
 * - Calls login and navigate on successful submit
 * - Displays error message on failed login
 * - Disables button and shows loading state when loading is true
 */

// Stub out axios and api modules to avoid ESM import issues in tests
jest.mock("axios", () => ({ create: jest.fn(() => ({})) }));
jest.mock("../services/api", () => ({}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

// Mock useAuth hook
jest.mock("../hooks/useAuth");
// Mock react-router-dom's useNavigate
jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: jest.fn(),
}));

describe("Login Component", () => {
  let mockLogin;
  let mockNavigate;

  beforeEach(() => {
    mockLogin = jest.fn();
    // default: not loading
    useAuth.mockReturnValue({ login: mockLogin, loading: false });

    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders email, password inputs and submit button", () => {
    render(<Login />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Log In/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("updates input values on change", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("calls login and navigates on successful submit", async () => {
    mockLogin.mockResolvedValueOnce();
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const button = screen.getByRole("button", { name: /Log In/i });

    fireEvent.change(emailInput, { target: { value: "user@domain.com" } });
    fireEvent.change(passwordInput, { target: { value: "securepass" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@domain.com", "securepass");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error message on failed login", async () => {
    const errorResponse = {
      response: { data: { message: "Invalid credentials" } },
    };
    mockLogin.mockRejectedValueOnce(errorResponse);

    render(<Login />);
    const button = screen.getByRole("button", { name: /Log In/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("falls back to generic error message if none provided", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Some error"));

    render(<Login />);
    const button = screen.getByRole("button", { name: /Log In/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  it("disables button and shows loading text when loading is true", () => {
    useAuth.mockReturnValue({ login: mockLogin, loading: true });
    render(<Login />);
    const button = screen.getByRole("button", { name: /Logging in…/i });
    expect(button).toBeDisabled();
  });
});
