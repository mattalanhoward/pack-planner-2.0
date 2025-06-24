/**
 * __tests__/SortableItem.test.jsx
 *
 * Tests for the SortableItem component:
 * - Renders item details in list and column modes
 * - Toggles worn and consumable states (success)
 * - Rolls back on API error and calls fetchItems
 * - Calls onToggleWorn and onToggleConsumable with new values
 * - Inline quantity editing: entering edit mode, committing value, and rollback on error
 * - Delete button calls onDelete
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SortableItem from '../components/SortableItem';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import * as dnd from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Stub axios to prevent ESM issues
jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn(() => ({ patch: jest.fn() })) }
}));

// Mock our API service
jest.mock('../services/api', () => ({
  __esModule: true,
  default: { patch: jest.fn() }
}));

// Stub toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  toast: { error: jest.fn() }
}));

// Stub DnD-kit useSortable
jest.mock('@dnd-kit/sortable', () => ({
  __esModule: true,
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
  })),
}));

// Stub CSS utilities
jest.mock('@dnd-kit/utilities', () => ({
  __esModule: true,
  CSS: { Transform: { toString: () => '' } },
}));

// Stub icons
jest.mock('react-icons/fa', () => ({
  __esModule: true,
FaGripVertical: () => <span data-testid="grip" />,
 FaUtensils: ({ onClick }) => <span data-testid="utensils" onClick={onClick} />,
 FaTshirt: ({ onClick }) => <span data-testid="tshirt" onClick={onClick} />,
 FaTrash: ({ onClick }) => <span data-testid="trash" onClick={onClick} />,
 FaEllipsisH: () => <span data-testid="ellipsis" />,
}));

beforeEach(() => {
  api.patch.mockClear();
  toast.error.mockClear();
  dnd.useSortable.mockClear();
});

describe('SortableItem', () => {
  const listId = 'list1';
  const catId = 'cat1';
  const item = {
    _id: 'item1',
    itemType: 'Type',
    brand: 'Brand',
    name: 'Name',
    weight: 10,
    price: 5,
    link: 'https://link',
    quantity: 2,
    worn: false,
    consumable: false,
  };
  let onToggleWorn, onToggleConsumable, onDelete, fetchItems, onQuantityChange;

  beforeEach(() => {
    onToggleWorn = jest.fn();
    onToggleConsumable = jest.fn();
    onDelete = jest.fn();
    fetchItems = jest.fn();
    onQuantityChange = jest.fn();
  });

  function renderComponent(isListMode = true) {
    render(
      <SortableItem
        item={item}
        listId={listId}
        catId={catId}
        onToggleConsumable={onToggleConsumable}
        onToggleWorn={onToggleWorn}
        onDelete={onDelete}
        isListMode={isListMode}
        fetchItems={fetchItems}
        onQuantityChange={onQuantityChange}
      />
    );
  }

  it('renders in list mode with correct details', () => {
    renderComponent(true);
    expect(screen.getAllByText('Brand')).toHaveLength(2);
    expect(screen.getAllByText('Name')).toHaveLength(2);
    expect(screen.getAllByText('10g')).toHaveLength(2);
    expect(screen.getAllByText(/€5/)).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByTestId('trash')).toHaveLength(2);
    expect(screen.getAllByTestId('utensils')).toHaveLength(2);
    expect(screen.getAllByTestId('tshirt')).toHaveLength(2);
  });

  it('renders in column mode', () => {
    renderComponent(false);
    expect(screen.getAllByText('Brand')).toHaveLength(1);
    expect(screen.getAllByText('Name')).toHaveLength(1);
    expect(screen.getAllByText('10g')).toHaveLength(1);
    expect(screen.getAllByText(/€5/)).toHaveLength(1);
    expect(screen.getAllByText('2')).toHaveLength(1);
  });

  it('toggles worn state successfully', async () => {
    api.patch.mockResolvedValueOnce({});
    renderComponent();
    fireEvent.click(screen.getAllByTestId('tshirt')[0]);
    expect(onToggleWorn).toHaveBeenCalledWith(catId, item._id, true);
    expect(api.patch).toHaveBeenCalledWith(
      `/lists/${listId}/categories/${catId}/items/${item._id}`,
      { worn: true }
    );
  });

  it('rolls back worn state on error', async () => {
    api.patch.mockRejectedValueOnce(new Error('fail'));
    renderComponent();
    fireEvent.click(screen.getAllByTestId('tshirt')[0]);
    await waitFor(() => expect(fetchItems).toHaveBeenCalledWith(catId));
    expect(toast.error).toHaveBeenCalledWith('fail');
  });

  it('toggles consumable state successfully', async () => {
    api.patch.mockResolvedValueOnce({});
    renderComponent();
    fireEvent.click(screen.getAllByTestId('utensils')[0]);
    expect(onToggleConsumable).toHaveBeenCalledWith(catId, item._id, true);
    expect(api.patch).toHaveBeenCalledWith(
      `/lists/${listId}/categories/${catId}/items/${item._id}`,
      { consumable: true }
    );
  });

  it('rolls back consumable state on error', async () => {
    api.patch.mockRejectedValueOnce(new Error('break'));
    renderComponent();
    fireEvent.click(screen.getAllByTestId('utensils')[0]);
    await waitFor(() => expect(fetchItems).toHaveBeenCalledWith(catId));
    expect(toast.error).toHaveBeenCalledWith('break');
  });

  it('edits quantity and commits new value', async () => {
    api.patch.mockResolvedValueOnce({});
    renderComponent();
    const qtySpan = screen.getAllByText('2')[0];
    fireEvent.click(qtySpan);
    const input = screen.getByDisplayValue('2');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onQuantityChange).toHaveBeenCalledWith(catId, item._id, 3);
      expect(api.patch).toHaveBeenCalledWith(
        `/lists/${listId}/categories/${catId}/items/${item._id}`,
        { quantity: 3 }
      );
    });
  });

  it('rolls back quantity on error', async () => {
    api.patch.mockRejectedValueOnce(new Error('oops'));
    renderComponent();
    const qtySpan = screen.getAllByText('2')[0];
    fireEvent.click(qtySpan);
    const input = screen.getByDisplayValue('2');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('oops'));
  });

  it('calls onDelete when trash clicked', () => {
    renderComponent();
    fireEvent.click(screen.getAllByTestId('trash')[0]);
    expect(onDelete).toHaveBeenCalledWith(catId, item._id);
  });
});
