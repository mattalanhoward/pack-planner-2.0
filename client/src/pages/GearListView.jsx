// src/pages/GearListView.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import GearItemCard from '../components/GearItemCard';

import {
  DndContext,
  pointerWithin,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

// Draggable wrapper
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function GearListView({ listId, refreshToggle }) {
  const [categories, setCategories]           = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [activeId, setActiveId]               = useState(null);

  // Fetch columns & cards
  useEffect(() => {
    if (!listId) return;
    (async () => {
      setLoading(true);
      try {
        const { data: cats } = await api.get(`/lists/${listId}/categories`);
        setCategories(cats);
        const map = {};
        for (let cat of cats) {
          const { data: items } = await api.get(
            `/lists/${listId}/categories/${cat._id}/items`
          );
          map[cat._id] = items;
        }
        setItemsByCategory(map);
      } catch (err) {
        console.error(err);
        setError('Failed to load board.');
      } finally {
        setLoading(false);
      }
    })();
  }, [listId, refreshToggle]);

  // DnD-kit sensors
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Reordering logic (same as before) …
  const reorderCategories = async (oldIndex, newIndex) => {
    const arr = [...categories];
    const [moved] = arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, moved);
    setCategories(arr);
    await api.patch(
      `/lists/${listId}/categories/${moved._id}/position`,
      { position: newIndex }
    );
  };

  const reorderItems = async (catId, oldIndex, newIndex) => {
    const arr = [...(itemsByCategory[catId] || [])];
    const [moved] = arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, moved);
    setItemsByCategory(prev => ({ ...prev, [catId]: arr }));
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${moved._id}/position`,
      { position: newIndex }
    );
  };

  const handleDragStart = ({ active }) => setActiveId(active.id.toString());

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const a = active.id.toString();
    const o = over.id.toString();
    const catIds = categories.map(c => c._id);

    // Column reorder
    if (catIds.includes(a) && catIds.includes(o)) {
      return reorderCategories(catIds.indexOf(a), catIds.indexOf(o));
    }

    // Card drag: find source category
    let sourceCat = null;
    for (let [catId, items] of Object.entries(itemsByCategory)) {
      if (items.some(it => it._id === a)) {
        sourceCat = catId;
        break;
      }
    }
    if (!sourceCat) return;

    // Dropped onto another card
    for (let [catId, items] of Object.entries(itemsByCategory)) {
      const overIndex = items.findIndex(it => it._id === o);
      if (overIndex !== -1) {
        if (catId === sourceCat) {
          return reorderItems(
            sourceCat,
            items.findIndex(it => it._id === a),
            overIndex
          );
        } else {
          // cross-column
          const moved = itemsByCategory[sourceCat].find(it => it._id === a);
          const newSource = itemsByCategory[sourceCat].filter(it => it._id !== a);
          const newDest = [...items];
          newDest.splice(overIndex, 0, moved);
          setItemsByCategory(prev => ({
            ...prev,
            [sourceCat]: newSource,
            [catId]: newDest
          }));
          return api.patch(
            `/lists/${listId}/categories/${sourceCat}/items/${a}`,
            { category: catId, position: overIndex }
          );
        }
      }
    }

    // Dropped into empty column => append
    if (catIds.includes(o)) {
      const destCat = o;
      const src = itemsByCategory[sourceCat] || [];
      const dst = itemsByCategory[destCat] || [];
      const oldIndex = src.findIndex(it => it._id === a);
      const newIndex = dst.length;
      if (destCat === sourceCat) {
        return reorderItems(sourceCat, oldIndex, newIndex - 1);
      }
      const moved = src.find(it => it._id === a);
      setItemsByCategory(prev => {
        const copy = { ...prev };
        copy[sourceCat] = prev[sourceCat].filter(it => it._id !== a);
        copy[destCat] = [...prev[destCat], moved];
        return copy;
      });
      return api.patch(
        `/lists/${listId}/categories/${sourceCat}/items/${a}`,
        { category: destCat, position: newIndex }
      );
    }
  };

  if (loading) return <div className="p-6">Loading board…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  // Drag overlay ghost
  const flatItems = Object.values(itemsByCategory).flat();
  const activeItem = flatItems.find(it => it._id === activeId);

  return (
    <div className="h-full flex flex-col p-6 min-w-min">

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext
          items={categories.map(c => c._id)}
          strategy={horizontalListSortingStrategy}
        >
          {/* Columns container */}
          <div className="flex flex-row space-x-4 mt-4 h-full">
            {categories.map(cat => (
              <SortableItem key={cat._id} id={cat._id}>
                {/* Each column is flex-col full height */}
                <div className="flex flex-col w-64 bg-gray-100 p-3 rounded h-full">
                  <h2 className="font-semibold mb-2">{cat.title}</h2>

                  <SortableContext
                    items={(itemsByCategory[cat._id] || []).map(i => i._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Card list: flex-1 plus vertical scroll */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {(itemsByCategory[cat._id] || []).map(item => (
                        <SortableItem key={item._id} id={item._id}>
                          <GearItemCard item={item} />
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <div className="w-64 h-24 rounded border-2 border-gray-400 opacity-50 pointer-events-none" />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
