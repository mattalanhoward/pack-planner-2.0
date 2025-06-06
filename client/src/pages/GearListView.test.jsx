// src/pages/GearListView.test.jsx

/**
 * NOTE: GearListView (as currently written) only supports "list" and "columns" modes—
 * it does not render any “Search catalog” input. These tests therefore focus only on
 * the list mode behavior (loading existing categories/items + toggling consumable, toggling worn, updating quantity).
 */

// 1) MOCK `api` before importing the component
jest.mock("../services/api", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

// 2) MOCK `react-hot-toast` and `sweetalert2`
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
}));

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GearListView from "./GearListView";
import api from "../services/api";
import { toast } from "react-hot-toast";

describe("GearListView component (list mode only)", () => {
  const listId = "L1";
  const category = { _id: "C1", title: "Shelter" };
  const existingItem = {
    _id: "I1",
    itemType: "Tent",
    brand: "Acme",
    name: "UltraTent",
    weight: 1500,
    price: 200,
    link: "",
    worn: false,
    consumable: false,
    quantity: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock GETs as before
    api.get.mockImplementation((url) => {
      if (url === `/lists`) {
        return Promise.resolve({ data: [{ _id: listId, title: "MyList" }] });
      }
      if (url === `/lists/${listId}/categories`) {
        return Promise.resolve({ data: [category] });
      }
      if (url === `/lists/${listId}/categories/${category._id}/items`) {
        return Promise.resolve({ data: [existingItem] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("loads categories & items, and toggles consumable successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list" // list mode
      />
    );

    // 1) Wait for list title “MyList” to appear
    await waitFor(() => {
      expect(screen.getByText("MyList")).toBeInTheDocument();
    });

    // 2) Wait for the category “Shelter” to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // 3) Wait for the item “Tent” (itemType) to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // 4) Click on the FaUtensils icon (title="Toggle consumable")
    const utensilIcon = screen.getByTitle("Toggle consumable");
    fireEvent.click(utensilIcon);

    // 5) Expect api.patch(`/lists/L1/categories/C1/items/I1`, { consumable: true }) to have been called
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`,
        { consumable: true }
      );
    });
  });

  test("shows toast.error when toggle consumable fails", async () => {
    // Arrange: make the PATCH throw a “Network error”
    api.patch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click the toggle‐consumable icon
    const utensilIcon = screen.getByTitle("Toggle consumable");
    fireEvent.click(utensilIcon);

    // Because the PATCH rejects, we expect toast.error("Network error")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  test("shows toast.error when toggle worn fails", async () => {
    // Arrange: make the PATCH throw a “Network error”
    api.patch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click the toggle‐worn icon (title="Toggle worn")
    const wornIcon = screen.getByTitle("Toggle worn");
    fireEvent.click(wornIcon);

    // Because the PATCH rejects, we expect toast.error("Network error")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  test("shows toast.error when update quantity fails", async () => {
    // Arrange: make the PATCH throw a different error
    api.patch.mockRejectedValueOnce(new Error("Oops"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // The quantity input is a <select> (role="combobox")—change its value from "1" to "2"
    const qtySelect = screen.getByRole("combobox");
    fireEvent.change(qtySelect, { target: { value: "2" } });

    // Because the PATCH rejects, we expect toast.error("Oops")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Oops");
    });
  });
});
