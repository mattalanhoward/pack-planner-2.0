import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GearListView from "./GearListView";
import api from "../services/api";
import { toast } from "react-hot-toast";

// Mock api and toast
jest.mock("../services/api", () => ({
  get: jest.fn(),
  patch: jest.fn(() => Promise.resolve()),
  post: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  defaults: { headers: { common: {} } },
}));
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("GearListView component (list mode and column mode)", () => {
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
    api.get.mockImplementation((url) => {
      if (url === `/lists`)
        return Promise.resolve({ data: [{ _id: listId, title: "MyList" }] });
      if (url === `/lists/${listId}/categories`)
        return Promise.resolve({ data: [category] });
      if (url === `/lists/${listId}/categories/${category._id}/items`)
        return Promise.resolve({ data: [existingItem] });
      return Promise.resolve({ data: [] });
    });
  });

  const clickFirstLabel = (label) => {
    const els = screen.getAllByLabelText(label);
    fireEvent.click(els[0]);
  };

  test("loads categories & items, and toggles consumable successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() => expect(screen.getByText("MyList")).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );

    clickFirstLabel("Toggle consumable");

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`,
        { consumable: true }
      );
    });
  });

  test("shows toast.error when toggle consumable fails", async () => {
    api.patch.mockRejectedValueOnce(new Error("Network error"));
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    clickFirstLabel("Toggle consumable");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to toggle consumable")
    );
  });

  test("toggles worn successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    clickFirstLabel("Toggle worn");
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`,
        { worn: true }
      );
    });
  });

  test("shows toast.error when toggle worn fails", async () => {
    api.patch.mockRejectedValueOnce(new Error("Network error"));
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    clickFirstLabel("Toggle worn");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to toggle worn")
    );
  });

  test("updates quantity successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    const qtyToggles = screen.getAllByTitle("Click to edit quantity");
    fireEvent.click(qtyToggles[0]);
    const numInput = screen.getByRole("spinbutton");
    fireEvent.change(numInput, { target: { value: "2" } });
    fireEvent.blur(numInput);
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`,
        { quantity: 2 }
      );
    });
  });

  test("shows toast.error when update quantity fails", async () => {
    api.patch.mockRejectedValueOnce(new Error("Oops"));
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    const qtyToggles = screen.getAllByTitle("Click to edit quantity");
    fireEvent.click(qtyToggles[0]);
    const numInput = screen.getByRole("spinbutton");
    fireEvent.change(numInput, { target: { value: "2" } });
    fireEvent.blur(numInput);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Oops"));
  });

  test("deletes an item successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    clickFirstLabel("Delete item");
    const confirmBtn = await screen.findByText("Yes, delete");
    fireEvent.click(confirmBtn);
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`
      )
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Item deleted")
    );
  });

  test("shows toast.error when delete item fails", async () => {
    api.delete.mockRejectedValueOnce(new Error("Server error"));
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );
    await waitFor(() =>
      expect(screen.getAllByText("Tent").length).toBeGreaterThan(0)
    );
    clickFirstLabel("Delete item");
    const confirmBtn = await screen.findByText("Yes, delete");
    fireEvent.click(confirmBtn);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to delete")
    );
  });

  // === COLUMN MODE TESTS ===

  test("renders column-mode container when viewMode='columns'", async () => {
    const { container } = render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="columns"
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );
    const columnWrapper = container.querySelector(".overflow-x-auto");
    expect(columnWrapper).toBeInTheDocument();
  });

  test("each category has draggable attributes in column mode", async () => {
    const { container } = render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="columns"
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );
    const handles = container.querySelectorAll(
      '[aria-roledescription="sortable"]'
    );
    expect(handles.length).toBeGreaterThanOrEqual(1);
    handles.forEach((handle) => {
      expect(handle).toHaveAttribute("aria-roledescription", "sortable");
      expect(handle).toHaveAttribute("tabindex");
    });
  });
});
