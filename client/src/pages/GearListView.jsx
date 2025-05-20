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

// Make any element draggable by its `id`
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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

  // Load columns and their cards
  useEffect(() => {
    async function loadBoard() {
      if (!listId) return;
      setLoading(true);
      setError('');
      try {
        const { data: cats } = await api.get(`/lists/${listId}/categories`);
        setCategories(cats);

        const map = {};
        await Promise.all(
          cats.map(async cat => {
            const { data: items } = await api.get(
              `/lists/${listId}/categories/${cat._id}/items`
            );
            map[cat._id] = items;
          })
        );
        setItemsByCategory(map);
      } catch (err) {
        console.error(err);
        setError('Failed to load board.');
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, [listId, refreshToggle]);

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Persist reordering of columns
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

  // Persist reorder within a category
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

  // Track drag start to show overlay
  const handleDragStart = ({ active }) => {
    setActiveId(active.id.toString());
  };

  // Global drag end
  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr   = over.id.toString();

    // 1) Column reordering?
    const catIds = categories.map(c => c._id);
    if (catIds.includes(activeIdStr) && catIds.includes(overIdStr)) {
      return reorderCategories(
        catIds.indexOf(activeIdStr),
        catIds.indexOf(overIdStr)
      );
    }

    // 2) Card drag
    // Find source category
    let sourceCat;
    for (const [catId, items] of Object.entries(itemsByCategory)) {
      if (items.some(it => it._id === activeIdStr)) {
        sourceCat = catId;
        break;
      }
    }
    if (!sourceCat) return;

    // Case A: dropped onto another card?
    for (const [catId, items] of Object.entries(itemsByCategory)) {
      const overIndex = items.findIndex(it => it._id === overIdStr);
      if (overIndex !== -1) {
        // same-cat or cross-cat insert before overIndex
        if (catId === sourceCat) {
          return reorderItems(sourceCat, 
            items.findIndex(it => it._id === activeIdStr),
            overIndex
          );
        } else {
          // cross-category
          const moved = itemsByCategory[sourceCat].find(it => it._id === activeIdStr);
          // remove from source
          const newSource = itemsByCategory[sourceCat].filter(it => it._id !== activeIdStr);
          // insert into destination at overIndex
          const newDest = [...items];
          newDest.splice(overIndex, 0, moved);
          setItemsByCategory(prev => ({
            ...prev,
            [sourceCat]: newSource,
            [catId]: newDest
          }));
          return api.patch(
            `/lists/${listId}/categories/${sourceCat}/items/${activeIdStr}`,
            { category: catId, position: overIndex }
          );
        }
      }
    }

    // Case B: dropped onto a column container (empty space or header)
    // If overIdStr is a category id, append to end
    if (catIds.includes(overIdStr)) {
      const destCat = overIdStr;
      const sourceItems = itemsByCategory[sourceCat] || [];
      const destItems = itemsByCategory[destCat] || [];
      const oldIndex = sourceItems.findIndex(it => it._id === activeIdStr);
      const newIndex = destItems.length; // append

      if (sourceCat === destCat) {
        return reorderItems(sourceCat, oldIndex, newIndex - 1);
      } else {
        const moved = sourceItems.find(it => it._id === activeIdStr);
        setItemsByCategory(prev => {
          const copy = { ...prev };
          copy[sourceCat] = prev[sourceCat].filter(it => it._id !== activeIdStr);
          copy[destCat] = [...prev[destCat], moved];
          return copy;
        });
        return api.patch(
          `/lists/${listId}/categories/${sourceCat}/items/${activeIdStr}`,
          { category: destCat, position: newIndex }
        );
      }
    }
  };

  if (loading) return <div className="p-6">Loading board…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  // For drag overlay
  const flatItems = Object.values(itemsByCategory).flat();
  const activeItem = flatItems.find(it => it._id === activeId);

  return (
    <div className="p-6">
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        &larr; Back to dashboard
      </Link>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Categories */}
        <SortableContext
          items={categories.map(c => c._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex space-x-4 overflow-x-auto mt-4">
            {categories.map(cat => (
              <SortableItem key={cat._id} id={cat._id}>
                <div className="w-64 bg-gray-100 p-3 rounded flex flex-col">
                  <h2 className="font-semibold mb-2">{cat.title}</h2>

                  {/* Cards */}
                  <SortableContext
                    items={(itemsByCategory[cat._id] || []).map(i => i._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 min-h-[4rem] overflow-auto space-y-2">
                      {(itemsByCategory[cat._id] || []).map(item => (
                        <SortableItem key={item._id} id={item._id}>
                          <GearItemCard item={item} onEdit={() => {}} />
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="w-64 h-24 rounded border-2 border-gray-400 opacity-50 pointer-events-none" />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
