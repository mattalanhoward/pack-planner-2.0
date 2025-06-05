// src/pages/Login.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";

// 1) Create a single mock for `login` so both component and test share it
const mockLogin = jest.fn();
jest.mock("../hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    login: mockLogin,
    loading: false,
  }),
}));

// 2) Create a single mock for useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

describe("Login component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders email, password inputs and Log In button", () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("successful login calls login() and then navigate", async () => {
    // Arrange: make login resolve
    mockLogin.mockResolvedValueOnce({ token: "abc123" });

    render(<Login />);
    const emailInput = screen.getByLabelText(/email/i);
    const pwdInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /log in/i });

    // Act: type credentials and submit
    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(pwdInput, "password123");
    fireEvent.click(submitBtn);

    // Assert: login() was called with correct args
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    });
    // Assert: navigate('/dashboard') was called
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("failed login shows error message", async () => {
    // Arrange: make login reject with an Axios‐like error
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: "Bad credentials" } },
    });

    render(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Assert: error message appears
    const errorMsg = await screen.findByText(/Bad credentials/i);
    expect(errorMsg).toBeInTheDocument();
    // Assert: navigate was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
