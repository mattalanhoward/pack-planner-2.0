// src/pages/GearListView.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

import GearItemCard from '../components/GearItemCard';
import AddGearItemModal from '../components/AddGearItemModal';

export default function GearListView({
  listId,
  refreshToggle,
  templateToggle,
}) {
  const [listName, setListName]     = useState('');
  const [categories, setCategories] = useState([]);
  const [itemsMap, setItemsMap]     = useState({});
  const [editingCatId, setEditingCatId] = useState(null);
  const [addingNewCat, setAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showAddModalCat, setShowAddModalCat] = useState(null);

  // 1) Load list title
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get('/lists');
      const found = data.find(l => l._id === listId);
      setListName(found?.title || '');
    })();
  }, [listId]);

  // 2) Load categories on id / toggles change
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get(`/lists/${listId}/categories`);
      setCategories(data);
    })();
  }, [listId, refreshToggle, templateToggle]);

  // 3) Load items for each category
  useEffect(() => {
    categories.forEach(cat => fetchItems(cat._id));
  }, [categories, refreshToggle, templateToggle]);

  const fetchItems = async catId => {
    const { data } = await api.get(
      `/lists/${listId}/categories/${catId}/items`
    );
    setItemsMap(m => ({ ...m, [catId]: data }));
  };

  // —— inline‐edit handlers —— //

  const toggleConsumable = async (catId, itemId) => {
    const item = itemsMap[catId].find(i => i._id === itemId);
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { consumable: !item.consumable }
    );
    fetchItems(catId);
  };

  const toggleWorn = async (catId, itemId) => {
    const item = itemsMap[catId].find(i => i._id === itemId);
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { worn: !item.worn }
    );
    fetchItems(catId);
  };

  const updateQuantity = async (catId, itemId, qty) => {
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { quantity: qty }
    );
    fetchItems(catId);
  };

  // —— end inline‐edit handlers —— //

  // delete an item
  const deleteItem = async (catId, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(
      `/lists/${listId}/categories/${catId}/items/${itemId}`
    );
    fetchItems(catId);
  };

  // add new category
  const confirmAddCat = async () => {
    const title = newCatName.trim();
    if (!title) return;
    const { data } = await api.post(
      `/lists/${listId}/categories`,
      { title, position: categories.length }
    );
    setCategories(c => [...c, data]);
    setNewCatName('');
    setAddingNewCat(false);
  };
  const cancelAddCat = () => {
    setNewCatName('');
    setAddingNewCat(false);
  };

  // delete / rename category
  const deleteCat = async id => {
    if (!window.confirm('Delete this category?')) return;
    await api.delete(`/lists/${listId}/categories/${id}`);
    setCategories(c => c.filter(x => x._id !== id));
    setItemsMap(m => {
      const copy = { ...m };
      delete copy[id];
      return copy;
    });
  };
  const saveCat = async (id, title) => {
    const { data } = await api.patch(
      `/lists/${listId}/categories/${id}`,
      { title }
    );
    setCategories(c => c.map(x => (x._id === id ? data : x)));
    setEditingCatId(null);
  };

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,    // need to drag 20px before a “drag” begins
        delay: 150       // or press for 150ms
      }
    })
  );
  const handleDragEnd = async ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldI = categories.findIndex(c => c._id === active.id);
      const newI = categories.findIndex(c => c._id === over.id);
      const reordered = arrayMove(categories, oldI, newI)
        .map((c, idx) => ({ ...c, position: idx }));
      setCategories(reordered);
      await api.patch(
        `/lists/${listId}/categories/${active.id}/position`,
        { position: newI }
      );
    }
  };

  // Sortable column
  function SortableColumn({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [local, setLocal] = useState(category.title);
    const catId = category._id;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="
          snap-center
          flex-shrink-0
          m-2
          w-4/5 md:w-64
          bg-sand/20
          rounded-lg
          p-3
          flex flex-col
          h-full
        "
      >
        {/* header */}
        <div className="flex items-center mb-2">
          <FaGripVertical
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab text-pine"
            style={{ touchAction: 'none' }}       // ← disable scrolling when touching the handle
          />
          {editingCatId === category._id ? (
            <input
              value={local}
              onChange={e => setLocal(e.target.value)}
              className="flex-1 border border-pine rounded p-1"
            />
          ) : (
            <h3 className="flex-1 font-semibold text-pine">{category.title}</h3>
          )}
          {editingCatId === category._id ? (
            <>
              <button onClick={() => saveCat(category._id, local)} className="text-teal mr-2">✓</button>
              <button onClick={() => setEditingCatId(null)} className="text-ember">×</button>
            </>
          ) : (
            <>
              <FaEdit
                onClick={() => { setEditingCatId(category._id); setLocal(category.title); }}
                className="mr-2 cursor-pointer text-pine"
              />
              <FaTrash
                onClick={() => deleteCat(category._id)}
                className="cursor-pointer text-ember"
              />
            </>
          )}
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {itemsMap[catId]?.map(item => (
            <GearItemCard
              key={item._id}
              item={item}
              onToggleConsumable={id => toggleConsumable(catId, id)}
              onToggleWorn={id => toggleWorn(catId, id)}
              onQuantityChange={(id, qty) => updateQuantity(catId, id, qty)}
              onDelete={id => deleteItem(catId, id)}
            />
          ))}
        </div>

        {/* add item */}
        <button
          onClick={() => setShowAddModalCat(category._id)}
          className="h-12 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20 flex-none"
        >
          <FaPlus /><span className="text-xs">Add Item</span>
        </button>

        {showAddModalCat === category._id && (
          <AddGearItemModal
            listId={listId}
            categoryId={category._id}
            onClose={() => setShowAddModalCat(null)}
            onAdded={() => fetchItems(category._id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden min-h-0">
      <h2 className="text-2xl font-bold text-pine mb-4 flex-none">{listName}</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map(c => c._id)}
          strategy={horizontalListSortingStrategy}
        >
          {/* ← scroll container now has touchAction pan-x and no vertical overflow */}
          <div
            className="
              flex-1 flex flex-nowrap
              snap-x snap-mandatory
              overflow-x-auto overflow-y-hidden
              px-4 overscroll-x-contain
            "
            style={{
              touchAction: 'pan-x',               // horizontal only
              WebkitOverflowScrolling: 'auto'     // disable momentum on iOS
            }}
          >
            {categories.map(cat => (
              <SortableColumn key={cat._id} category={cat} />
            ))}

            {/* Add New Category */}
            <div className="snap-center flex-shrink-0 m-2 w-4/5 md:w-64 flex flex-col h-full">
              {addingNewCat ? (
                <div className="bg-sand/10 rounded-lg p-3 flex-1 flex flex-col">
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    className="border border-pine rounded p-1 mb-2"
                  />
                  <div className="flex justify-end space-x-2 mt-auto">
                    <button onClick={cancelAddCat} className="text-ember">×</button>
                    <button onClick={confirmAddCat} className="text-teal">✓</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNewCat(true)}
                  className="h-12 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20 flex-none"
                >
                  <FaPlus /><span className="text-xs">Add New Category</span>
                </button>
              )}
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
