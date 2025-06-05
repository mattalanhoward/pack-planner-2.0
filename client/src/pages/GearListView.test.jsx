// src/pages/GearListView.test.jsx

// 1) MOCK api before importing the component
jest.mock("../services/api", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

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

describe("GearListView component", () => {
  const listId = "L1";
  const category = { _id: "C1", title: "Shelter" };
  const item = {
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

    // Mock GET /lists to return the list’s title
    api.get.mockImplementation((url) => {
      if (url === `/lists`) {
        return Promise.resolve({ data: [{ _id: listId, title: "MyList" }] });
      }
      if (url === `/lists/${listId}/categories`) {
        return Promise.resolve({ data: [category] });
      }
      if (url === `/lists/${listId}/categories/${category._id}/items`) {
        return Promise.resolve({ data: [item] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test("loads categories & items, and toggles consumable", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for the list title “MyList” to appear
    await waitFor(() => {
      expect(screen.getByText("MyList")).toBeInTheDocument();
    });

    // Wait for the category “Shelter” to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click on the FaUtensils icon (title="Toggle consumable")
    const utensilIcon = screen.getByTitle("Toggle consumable");
    fireEvent.click(utensilIcon);

    // Expect api.patch(`/lists/L1/categories/C1/items/I1`, { consumable: true }) to have been called
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${item._id}`,
        { consumable: true }
      );
    });
  });
});
