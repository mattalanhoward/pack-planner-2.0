// src/components/SortableItem.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SortableItem from "./SortableItem";

const dummyItem = {
  _id: "123",
  itemType: "Tent",
  brand: "Acme",
  name: "UltraTent",
  weight: 1500,
  price: 120,
  link: "https://example.com",
  worn: false,
  consumable: true,
  quantity: 2,
};

describe("SortableItem component", () => {
  const mockOnToggleConsumable = jest.fn();
  const mockOnToggleWorn = jest.fn();
  const mockOnQuantityChange = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders item details correctly", () => {
    render(
      <SortableItem
        item={dummyItem}
        catId="catA"
        onToggleConsumable={mockOnToggleConsumable}
        onToggleWorn={mockOnToggleWorn}
        onQuantityChange={mockOnQuantityChange}
        onDelete={mockOnDelete}
        isListMode={true}
      />
    );

    // Brand & name appear
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByText(/UltraTent/)).toBeInTheDocument();

    // Weight “1500g” appears
    expect(screen.getByText(/1500g/)).toBeInTheDocument();

    // Price “€120” is rendered as a link (anchor)
    const priceLink = screen.getByText("€120");
    expect(priceLink.tagName).toBe("A");
    expect(priceLink).toHaveAttribute("href", "https://example.com");

    // Quantity select shows default “2”
    const qtySelect = screen.getByDisplayValue("2");
    expect(qtySelect).toBeInTheDocument();
  });

  test("clicking consumable icon calls onToggleConsumable", () => {
    render(
      <SortableItem
        item={dummyItem}
        catId="catA"
        onToggleConsumable={mockOnToggleConsumable}
        onToggleWorn={mockOnToggleWorn}
        onQuantityChange={mockOnQuantityChange}
        onDelete={mockOnDelete}
        isListMode={false}
      />
    );

    // The utensil icon has title="Toggle consumable"
    const utensilIcon = screen.getByTitle("Toggle consumable");
    fireEvent.click(utensilIcon);
    expect(mockOnToggleConsumable).toHaveBeenCalledWith("catA", "123");
  });

  test("clicking worn icon calls onToggleWorn", () => {
    render(
      <SortableItem
        item={dummyItem}
        catId="catA"
        onToggleConsumable={mockOnToggleConsumable}
        onToggleWorn={mockOnToggleWorn}
        onQuantityChange={mockOnQuantityChange}
        onDelete={mockOnDelete}
        isListMode={false}
      />
    );

    // The T-shirt icon has title="Toggle worn"
    const tshirtIcon = screen.getByTitle("Toggle worn");
    fireEvent.click(tshirtIcon);
    expect(mockOnToggleWorn).toHaveBeenCalledWith("catA", "123");
  });

  test("changing quantity calls onQuantityChange", () => {
    render(
      <SortableItem
        item={dummyItem}
        catId="catA"
        onToggleConsumable={mockOnToggleConsumable}
        onToggleWorn={mockOnToggleWorn}
        onQuantityChange={mockOnQuantityChange}
        onDelete={mockOnDelete}
        isListMode={false}
      />
    );

    // Find the <select> by its current value “2”
    const select = screen.getByDisplayValue("2");
    fireEvent.change(select, { target: { value: "5" } });
    expect(mockOnQuantityChange).toHaveBeenCalledWith("catA", "123", 5);
  });

  test("clicking delete icon calls onDelete", () => {
    render(
      <SortableItem
        item={dummyItem}
        catId="catA"
        onToggleConsumable={mockOnToggleConsumable}
        onToggleWorn={mockOnToggleWorn}
        onQuantityChange={mockOnQuantityChange}
        onDelete={mockOnDelete}
        isListMode={false}
      />
    );

    // The delete button has title="Delete item"
    const deleteBtn = screen.getByTitle("Delete item");
    fireEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith("catA", "123");
  });
});
