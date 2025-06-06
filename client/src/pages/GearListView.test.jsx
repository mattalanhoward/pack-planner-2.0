// src/pages/GearListView.test.jsx

/**
 * NOTE: GearListView (as currently written) only supports "list" and "columns" modes—
 * it does not render any “Search catalog” input. These tests therefore focus only on
 * the list mode behavior (loading existing categories/items + toggling consumable, toggling worn,
 * updating quantity, deleting an item, editing/deleting categories, and adding/canceling a new category).
 */

// 1) MOCK `api` before importing the component
jest.mock("../services/api", () => ({
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  defaults: { headers: { common: {} } },
}));

// 2) MOCK `react-hot-toast`
jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// 3) We no longer mock sweetalert2 here — it's been removed from GearListView.
//    Instead we rely on our `<ConfirmDialog>` and will click its buttons in tests.

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GearListView from "./GearListView";
import api from "../services/api";
import { toast } from "react-hot-toast";

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

    // Mock GET endpoints:
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

  //
  // === LIST MODE TESTS ===
  //

  test("loads categories & items, and toggles consumable successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
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

  test("toggles worn successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait until the “Tent” item is rendered
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click the “Toggle worn” icon (title="Toggle worn")
    fireEvent.click(screen.getByTitle("Toggle worn"));

    // Verify that api.patch was called with { worn: true } for that item
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

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click the toggle‐worn icon (title="Toggle worn")
    fireEvent.click(screen.getByTitle("Toggle worn"));

    // Because the PATCH rejects, we expect toast.error("Network error")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
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

    // Wait until the “Tent” item appears
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Change the <select> (quantity) from “1” to “2”
    fireEvent.change(screen.getByDisplayValue("1"), {
      target: { value: "2" },
    });

    // Expect api.patch(`/lists/.../items/I1`, { quantity: 2 }) to have been called
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

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Change the <select> (quantity selector) from “1” to “2”
    fireEvent.change(screen.getByDisplayValue("1"), {
      target: { value: "2" },
    });

    // Because the PATCH rejects, we expect toast.error("Oops")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Oops");
    });
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

    // Wait for the item “Tent” to appear
    await waitFor(() => {
      expect(screen.getByText("Tent")).toBeInTheDocument();
    });

    // Click the “Delete item” button (title="Delete item")
    fireEvent.click(screen.getByTitle("Delete item"));

    // Now our <ConfirmDialog> should render a “Yes, delete” button:
    const confirmBtn = await screen.findByText("Yes, delete");
    fireEvent.click(confirmBtn);

    // Expect api.delete(`/lists/L1/categories/C1/items/I1`) to have been called
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}/items/${existingItem._id}`
      );
    });

    // And we should see toast.success("Item deleted")
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Item deleted");
    });
  });

  test("shows toast.error when delete item fails", async () => {
    // Make the DELETE throw an error
    api.delete.mockRejectedValueOnce(new Error("Server error"));

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

    // Click the “Delete item” button
    fireEvent.click(screen.getByTitle("Delete item"));

    // Click “Yes, delete” in our ConfirmDialog:
    const confirmBtn = await screen.findByText("Yes, delete");
    fireEvent.click(confirmBtn);

    // Because api.delete rejects, we expect toast.error("Failed to delete")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete");
    });
  });

  test("renames a category successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for "Shelter" to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Click the edit‐icon on that category (FaEdit on category header)
    fireEvent.click(screen.getByTitle("Edit category"));

    // Replace the <input> value with a new title, e.g. "Camp Gear"
    const input = screen.getByDisplayValue("Shelter");
    fireEvent.change(input, { target: { value: "Camp Gear" } });

    // Click the ✓ button to confirm rename
    fireEvent.click(screen.getByText("✓"));

    // Expect api.patch(`/lists/L1/categories/C1`, { title: "Camp Gear" }) to have been called
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}`,
        { title: "Camp Gear" }
      );
    });
  });

  test("shows toast.error when rename category fails", async () => {
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

    // Wait for "Shelter" to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Click the edit‐icon on that category
    fireEvent.click(screen.getByTitle("Edit category"));

    // Change input to "Camp Gear"
    const input = screen.getByDisplayValue("Shelter");
    fireEvent.change(input, { target: { value: "Camp Gear" } });

    // Click the ✓ to attempt rename
    fireEvent.click(screen.getByText("✓"));

    // Because PATCH rejects, we expect toast.error("Failed to rename category")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to rename category");
    });
  });

  test("cancels renaming a category without calling API", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for "Shelter" to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Click "Edit category"
    fireEvent.click(screen.getByTitle("Edit category"));

    // Change the input to "Camp Gear"
    const input = screen.getByDisplayValue("Shelter");
    fireEvent.change(input, { target: { value: "Camp Gear" } });

    // Click "×" to cancel
    fireEvent.click(screen.getByText("×"));

    // We should still see "Shelter" and api.patch should not have been called
    expect(screen.getByText("Shelter")).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });

  test("deletes a category successfully", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for "Shelter" to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Click the trash‐icon on that category (FaTrash with title="Delete category")
    fireEvent.click(screen.getByTitle("Delete category"));

    // ConfirmDialog will open—click the “Yes, delete” button
    fireEvent.click(screen.getByText("Yes, delete"));

    // Expect api.delete(`/lists/L1/categories/C1`) to have been called
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${category._id}`
      );
    });

    // And we should see toast.success("Category deleted")
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Category deleted");
    });
  });

  test("shows toast.error when delete category fails", async () => {
    // Arrange: make the DELETE throw a “Server error”
    api.delete.mockRejectedValueOnce(new Error("Server error"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for "Shelter" to appear
    await waitFor(() => {
      expect(screen.getByText("Shelter")).toBeInTheDocument();
    });

    // Click the trash‐icon to delete category
    fireEvent.click(screen.getByTitle("Delete category"));

    // ConfirmDialog opens—click “Yes, delete”
    fireEvent.click(screen.getByText("Yes, delete"));

    // Because api.delete rejects, expect toast.error("Failed to delete")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete");
    });
  });

  test("adds a new category successfully", async () => {
    // Arrange: mock POST to succeed
    api.post.mockResolvedValueOnce({
      data: { _id: "C2", title: "Cooking", position: 1 },
    });

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for initial load
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );

    // Click “Add New Category”
    fireEvent.click(screen.getByRole("button", { name: /Add New Category/i }));

    // Type “Cooking” into the input
    const input = screen.getByPlaceholderText("Category name");
    fireEvent.change(input, { target: { value: "Cooking" } });

    // Click the ✓ button to confirm
    fireEvent.click(screen.getByText("✓"));

    // Expect POST to have been called with { title: "Cooking", position: 1 }
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/lists/${listId}/categories`, {
        title: "Cooking",
        position: 1,
      });
    });

    // Expect toast.success to have been called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Category Added! 🎉");
    });

    // And “Cooking” should now appear in the document
    await waitFor(() =>
      expect(screen.getByText("Cooking")).toBeInTheDocument()
    );
  });

  test("shows toast.error when add category fails", async () => {
    // Arrange: force POST to reject
    api.post.mockRejectedValueOnce(new Error("Oops, cannot add"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for “Shelter” to appear
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );

    // Click “Add New Category”
    fireEvent.click(screen.getByRole("button", { name: /Add New Category/i }));

    // Type “Cooking” into the input
    const input = screen.getByPlaceholderText("Category name");
    fireEvent.change(input, { target: { value: "Cooking" } });

    // Click ✓ to confirm
    fireEvent.click(screen.getByText("✓"));

    // Because POST rejects, expect toast.error("Oops, cannot add")
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Oops, cannot add");
    });
  });

  test("cancels adding a new category when clicking ×", async () => {
    render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="list"
      />
    );

    // Wait for “Shelter” to appear
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );

    // Click “Add New Category”
    fireEvent.click(screen.getByRole("button", { name: /Add New Category/i }));

    // Now click × (cancel)
    fireEvent.click(screen.getByText("×"));

    // The input should no longer be in the document, and api.post should not have been called
    expect(screen.queryByPlaceholderText("Category name")).toBeNull();
    expect(api.post).not.toHaveBeenCalled();
  });

  //
  // === COLUMN MODE TESTS ===
  //

  test("renders column-mode container when viewMode='columns'", async () => {
    const { container } = render(
      <GearListView
        listId={listId}
        refreshToggle={false}
        templateToggle={false}
        viewMode="columns"
      />
    );

    // Wait for initial data
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );

    // Find the outer container that has `overflow-x-auto`
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

    // Wait for initial data
    await waitFor(() =>
      expect(screen.getByText("Shelter")).toBeInTheDocument()
    );

    // Grab all elements that have aria-roledescription="sortable"
    const handles = container.querySelectorAll(
      '[aria-roledescription="sortable"]'
    );

    // There should be at least one handle per category; here we only have one category,
    // but items also render draggable handles, so assert at least one.
    expect(handles.length).toBeGreaterThanOrEqual(1);

    handles.forEach((handle) => {
      expect(handle).toHaveAttribute("aria-roledescription", "sortable");
      // Also ensure it has a tabindex (i.e., it's keyboard‐focusable)
      expect(handle).toHaveAttribute("tabindex");
    });
  });
});
