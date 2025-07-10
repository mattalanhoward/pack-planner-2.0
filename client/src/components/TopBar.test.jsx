// src/components/TopBar.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TopBar from "./TopBar";

// 1) Create a single mock for `logout` and force the hook to return it.
const mockLogout = jest.fn();
jest.mock("../hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({
    logout: mockLogout,
  }),
}));

describe("TopBar component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders title and calls logout on button click", () => {
    // Provide a dummy setViewMode for the toggle
    const mockSetViewMode = jest.fn();
    render(
      <TopBar title="My App" viewMode="column" setViewMode={mockSetViewMode} />
    );

    // 2) The title should appear
    expect(screen.getByText("My App")).toBeInTheDocument();

    // 3) There are exactly two <button> elements:
    //    [0] = ViewToggle, [1] = Logout
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    // 4) The second button is the logout button
    const logoutBtn = buttons[1];
    fireEvent.click(logoutBtn);

    // 5) Now assert that our single `mockLogout` function was called exactly once
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test("clicking view‐toggle calls setViewMode", () => {
    const mockSetViewMode = jest.fn();
    render(
      <TopBar title="Test" viewMode="columns" setViewMode={mockSetViewMode} />
    );

    // The first <button> is the ViewToggle
    const buttons = screen.getAllByRole("button");
    const viewToggleBtn = buttons[0];

    fireEvent.click(viewToggleBtn);
    // Expect setViewMode to have been called with a function
    expect(mockSetViewMode).toHaveBeenCalledWith(expect.any(Function));
  });
});
