// src/components/Sidebar.test.jsx

// 1) MOCK `../services/api` BEFORE ANYTHING ELSE
jest.mock("../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

// 2) MOCK `react-hot-toast` AND `sweetalert2`
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));

// 3) NOW IMPORT React, RTL, Sidebar, and our mocked modules
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "./Sidebar";
import api from "../services/api"; // ← our mocked API
import { toast } from "react-hot-toast";

describe("Sidebar component", () => {
  const mockOnSelectList = jest.fn();
  const mockOnItemAdded = jest.fn();
  const mockOnTemplateEdited = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and displays gear lists & auto-selects the first one", async () => {
    // Arrange: mock GET /lists and GET /global/items
    api.get.mockImplementation((url) => {
      if (url === "/lists") {
        return Promise.resolve({
          data: [
            { _id: "L1", title: "Camping" },
            { _id: "L2", title: "Climbing" },
          ],
        });
      }
      if (url === "/global/items") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    // Act: render and wait for lists
    render(
      <Sidebar
        currentListId={null}
        onSelectList={mockOnSelectList}
        onItemAdded={mockOnItemAdded}
        onTemplateEdited={mockOnTemplateEdited}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Camping")).toBeInTheDocument();
      expect(screen.getByText("Climbing")).toBeInTheDocument();
    });

    // Because currentListId was null, the first list (L1) must be auto-selected
    expect(mockOnSelectList).toHaveBeenCalledWith("L1");
  });

  test("creating a new list calls api.post and shows toast.success", async () => {
    // 1) fetchLists on mount → empty list
    api.get.mockResolvedValueOnce({ data: [] });
    // 2) fetchGlobalItems on mount → empty
    api.get.mockResolvedValueOnce({ data: [] });
    // 3) createList POST → returns new list
    api.post.mockResolvedValueOnce({ data: { _id: "L3", title: "Hiking" } });
    // 4) fetchLists after POST → returns new list
    api.get.mockResolvedValueOnce({ data: [{ _id: "L3", title: "Hiking" }] });
    // 5) fetchGlobalItems again (stubbed)
    api.get.mockResolvedValueOnce({ data: [] });

    // Render Sidebar
    render(
      <Sidebar
        currentListId={null}
        onSelectList={mockOnSelectList}
        onItemAdded={mockOnItemAdded}
        onTemplateEdited={mockOnTemplateEdited}
      />
    );

    // Wait for initial mount to settle (no lists visible)
    await waitFor(() => {
      expect(screen.queryByText("Hiking")).not.toBeInTheDocument();
    });

    // Type “Hiking” into the “New list” input
    const input = screen.getByPlaceholderText("New list");
    fireEvent.change(input, { target: { value: "Hiking" } });

    // “Create” button should now be enabled
    const createBtn = screen.getByRole("button", { name: /create/i });
    expect(createBtn).not.toBeDisabled();

    // Click “Create”
    fireEvent.click(createBtn);

    // Assert: api.post('/lists', { title: 'Hiking' }) was called
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/lists", { title: "Hiking" });
    });

    // Assert: toast.success('List created!') was called
    expect(toast.success).toHaveBeenCalledWith("List created!");

    // After POST, fetchLists returns the new list—wait for it to appear
    await waitFor(() => {
      expect(screen.getByText("Hiking")).toBeInTheDocument();
    });
  });

  test("Create button is disabled when input is empty", async () => {
    // Arrange: initial fetchLists & fetchGlobalItems → empty arrays
    api.get.mockResolvedValueOnce({ data: [] }); // first fetchLists
    api.get.mockResolvedValueOnce({ data: [] }); // first fetchGlobalItems

    // Render Sidebar
    render(
      <Sidebar
        currentListId={null}
        onSelectList={mockOnSelectList}
        onItemAdded={mockOnItemAdded}
        onTemplateEdited={mockOnTemplateEdited}
      />
    );

    // Wait for initial mount to finish
    await waitFor(() => {
      // Check that “Create” is disabled when input is blank
      const createBtn = screen.getByRole("button", { name: /create/i });
      expect(createBtn).toBeDisabled();
    });
  });
});
