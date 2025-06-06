// src/App.test.jsx

// 1) MOCK './services/api' so that import.meta.env is never evaluated
jest.mock("./services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

// 2) STUB OUT Login and Dashboard (and GearListView) so they don’t import api or useAuth themselves
jest.mock("./pages/Login", () => () => (
  <div data-testid="login-page">Login Page</div>
));
jest.mock("./pages/Dashboard", () => () => (
  <div data-testid="dashboard-page">Dashboard Page</div>
));
jest.mock("./pages/GearListView", () => () => (
  <div data-testid="mock-gearlistview" />
));

// 3) MOCK useAuth before importing App
jest.mock("./hooks/useAuth");
import useAuth from "./hooks/useAuth";

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App routing (PrivateRoute)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to /login when not authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument();
  });

  test("renders Dashboard when authenticated", () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  test("renders Login when navigating to /login", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });
});
