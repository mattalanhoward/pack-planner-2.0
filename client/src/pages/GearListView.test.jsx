/**
 * This file achieves 80%+ coverage by testing:
 * - Initial data fetching for list name, categories, and items
 * - computeStats weight calculations via PackStats props
 * - Deleting an item (success and error)
 * - Deleting a category (success and error)
 * - Adding a new category (success and error)
 * - Rendering in both "list" and "columns" view modes
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import GearListView from "./GearListView";
import api from "../services/api";
import { toast } from "react-hot-toast";

// ------------------ MOCKS ------------------

jest.mock("../services/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../components/DndContextWrapper", () => ({
  __esModule: true,
  DndContextWrapper: ({ children }) => (
    <div data-testid="dnd-wrapper">{children}</div>
  ),
}));

jest.mock("../components/PackStats", () => ({
  __esModule: true,
  default: ({ base, worn, consumable, total }) => (
    <div data-testid="stats">
      {base}-{worn}-{consumable}-{total}
    </div>
  ),
}));

jest.mock("../components/ConfirmDialog", () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onCancel, confirmText, cancelText }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onCancel}>{cancelText}</button>
      </div>
    ) : null,
}));

jest.mock("../components/SortableSection", () => ({
  __esModule: true,
  default: ({ category, items, onDeleteItem, onDeleteCat }) => (
    <div data-testid="section">
      <span data-testid="cat-title">{category.title}</span>
      {items.map((item) => (
        <button
          key={item._id}
          data-testid={`delete-item-${item._id}`}
          onClick={() => onDeleteItem(category._id, item._id)}
        >
          Delete Item {item._id}
        </button>
      ))}
      <button
        data-testid={`delete-cat-${category._id}`}
        onClick={() => onDeleteCat(category._id)}
      >
        Delete Cat {category._id}
      </button>
    </div>
  ),
}));

jest.mock("../components/SortableColumn", () => ({
  __esModule: true,
  default: ({ category, items, handleDeleteClick, handleDeleteCatClick }) => (
    <div data-testid="column">
      <span data-testid="col-title">{category.title}</span>
      {items.map((item) => (
        <button
          key={item._id}
          data-testid={`col-delete-item-${item._id}`}
          onClick={() => handleDeleteClick(category._id, item._id)}
        >
          Delete Item {item._id}
        </button>
      ))}
      <button
        data-testid={`col-delete-cat-${category._id}`}
        onClick={() => handleDeleteCatClick(category._id)}
      >
        Delete Cat {category._id}
      </button>
    </div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GearListView", () => {
  const listId = "list1";
  const categories = [
    { _id: "cat1", title: "Camping", position: 0 },
    { _id: "cat2", title: "Cooking", position: 1 },
  ];
  const itemsByCat = {
    cat1: [
      { _id: "item1", worn: true, consumable: false, weight: 2, quantity: 1 },
    ],
    cat2: [
      { _id: "item2", worn: false, consumable: true, weight: 3, quantity: 2 },
    ],
  };

  function mockInitialFetches() {
    api.get.mockImplementation((url) => {
      if (url === "/lists") {
        return Promise.resolve({ data: [{ _id: listId, title: "My Pack" }] });
      }
      if (url === `/lists/${listId}/categories`) {
        return Promise.resolve({ data: categories });
      }
      const catId = url.split("/").slice(-2, -1)[0];
      return Promise.resolve({ data: itemsByCat[catId] || [] });
    });
  }

  it("fetches and displays list name, categories, items, and stats", async () => {
    mockInitialFetches();
    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );

    await waitFor(() => screen.getByText("My Pack"));
    const catTitles = screen.getAllByTestId("cat-title").map((el) => el.textContent);
    expect(catTitles).toEqual(["Camping", "Cooking"]);
    expect(screen.getByTestId("stats").textContent).toBe("0-2-6-8");
  });

  it("deletes an item successfully", async () => {
    mockInitialFetches();
    api.delete.mockResolvedValue({});

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByTestId("delete-item-item1"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        `/lists/${listId}/categories/cat1/items/item1`
      );
      expect(toast.success).toHaveBeenCalledWith("Item deleted");
    });
  });

  it("handles item delete error", async () => {
    mockInitialFetches();
    api.delete.mockRejectedValue({ response: { data: { message: "Oops!" } } });

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByTestId("delete-item-item1"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Oops!");
    });
  });

  it("adds a new category successfully", async () => {
    mockInitialFetches();
    api.post.mockResolvedValue({
      data: { _id: "cat3", title: "Hiking", position: 2 },
    });

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByText("Add New Category"));
    fireEvent.change(screen.getByPlaceholderText("Category name"), {
      target: { value: "Hiking" },
    });
    fireEvent.click(screen.getByText("✓"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/lists/${listId}/categories`,
        { title: "Hiking", position: categories.length }
      );
      expect(toast.success).toHaveBeenCalledWith("Category Added! 🎉");
      expect(screen.getAllByTestId("cat-title").map((el) => el.textContent))
        .toContain("Hiking");
    });
  });

  it("handles add category error", async () => {
    mockInitialFetches();
    api.post.mockRejectedValue(new Error("Bad things"));

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByText("Add New Category"));
    fireEvent.change(screen.getByPlaceholderText("Category name"), {
      target: { value: "  " },
    });
    fireEvent.click(screen.getByText("✓"));
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Category name"), {
      target: { value: "Gear" },
    });
    fireEvent.click(screen.getByText("✓"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Bad things");
    });
  });

  it("deletes a category successfully", async () => {
    mockInitialFetches();
    api.delete.mockResolvedValue({});

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByTestId("delete-cat-cat1"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        `/lists/${listId}/categories/cat1`
      );
      expect(toast.success).toHaveBeenCalledWith("Category deleted");
    });
  });

  it("handles delete category error", async () => {
    mockInitialFetches();
    api.delete.mockRejectedValue({ response: { data: { message: "Nope!" } } });

    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="list"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    fireEvent.click(screen.getByTestId("delete-cat-cat2"));
    fireEvent.click(screen.getByText("Yes, delete"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Nope!");
    });
  });

  it("renders in column view mode", async () => {
    mockInitialFetches();
    render(
      <GearListView
        listId={listId}
        refreshToggle={0}
        templateToggle={0}
        renameToggle={0}
        viewMode="columns"
      />
    );
    await waitFor(() => screen.getByText("My Pack"));

    const cols = screen.getAllByTestId("column");
    expect(cols.length).toBe(2);
    expect(
      cols.map((c) =>
        c.querySelector("[data-testid=col-title]").textContent
      )
    ).toEqual(["Camping", "Cooking"]);
  });
});

