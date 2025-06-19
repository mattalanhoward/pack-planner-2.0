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

  test("renders item details correctly in list mode", () => {
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

    // Brand appears twice (mobile & desktop)
    const brands = screen.getAllByText(/Acme/);
    expect(brands).toHaveLength(2);

    // Name appears twice
    const names = screen.getAllByText(/UltraTent/);
    expect(names).toHaveLength(2);

    // Weight appears twice
    const weights = screen.getAllByText(/1500g/);
    expect(weights).toHaveLength(2);

    // Price appears twice
    const prices = screen.getAllByText("€120");
    expect(prices).toHaveLength(2);
  });

  test("renders item details correctly in column mode", () => {
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

    // Brand and name appear once
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByText(/UltraTent/)).toBeInTheDocument();

    // Link around name
    const nameLink = screen.getByRole("link", { name: /UltraTent/ });
    expect(nameLink).toHaveAttribute("href", dummyItem.link);

    // Weight appears
    expect(screen.getByText(/1500g/)).toBeInTheDocument();

    // Price appears
    expect(screen.getByText("€120")).toBeInTheDocument();
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

    const tshirtIcon = screen.getByTitle("Toggle worn");
    fireEvent.click(tshirtIcon);
    expect(mockOnToggleWorn).toHaveBeenCalledWith("catA", "123");
  });

  test("changing quantity via inline edit calls onQuantityChange", () => {
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

    // Enter edit mode by clicking the displayed quantity
    const qtySpan = screen.getByText("2");
    fireEvent.click(qtySpan);

    // Should render a number input
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);

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

    const deleteBtn = screen.getByTitle("Delete item");
    fireEvent.click(deleteBtn);
    expect(mockOnDelete).toHaveBeenCalledWith("catA", "123");
  });
});
