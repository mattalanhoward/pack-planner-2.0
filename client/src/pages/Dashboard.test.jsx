// src/pages/Dashboard.test.jsx

// 1) MOCK '../services/api' so that any import of api.js never tries to parse import.meta.env
jest.mock("../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

// 2) MOCK useAuth before importing Dashboard
jest.mock("../hooks/useAuth");
import useAuth from "../hooks/useAuth";

import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

// 3) MOCK child components that Dashboard renders
jest.mock("../components/TopBar", () => () => (
  <div data-testid="mock-topbar">TopBar</div>
));
jest.mock("../components/Sidebar", () => () => (
  <div data-testid="mock-sidebar">Sidebar</div>
));
jest.mock("./GearListView", () => () => (
  <div data-testid="mock-gearlistview">GearListView</div>
));

describe("Dashboard component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when not authenticated", () => {
    // Provide the mock return value for useAuth
    useAuth.mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    const { container } = render(<Dashboard />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders TopBar & Sidebar when authenticated, no list selected", () => {
    useAuth.mockReturnValue({ isAuthenticated: true, logout: jest.fn() });

    render(<Dashboard />);

    expect(screen.getByTestId("mock-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sidebar")).toBeInTheDocument();
    // When no list is selected initially, GearListView should not appear
    expect(screen.queryByTestId("mock-gearlistview")).not.toBeInTheDocument();
    expect(
      screen.getByText(/select a gear list to begin/i)
    ).toBeInTheDocument();
  });
});
