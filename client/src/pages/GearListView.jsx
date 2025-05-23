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
import GearItemModal from '../components/GearItemModal';

export default function GearListView({
  listId,
  refreshToggle,    // toggles when an item is added
  templateToggle,   // toggles when a global template is edited/deleted
}) {
  const [listName, setListName]           = useState('');
  const [categories, setCategories]       = useState([]);
  const [itemsMap, setItemsMap]           = useState({});
  const [editingCatId, setEditingCatId]   = useState(null);
  const [addingNewCat, setAddingNewCat]   = useState(false);
  const [newCatName, setNewCatName]       = useState('');
  const [editingItem, setEditingItem]     = useState(null);
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

  // 2) Load categories whenever listId, or refreshToggle, or templateToggle changes
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get(`/lists/${listId}/categories`);
      setCategories(data);
    })();
  }, [listId, refreshToggle, templateToggle]);

  // 3) Load items for each category whenever categories list or either toggle changes
  useEffect(() => {
    categories.forEach(cat => fetchItems(cat._id));
  }, [categories, refreshToggle, templateToggle]);

  const fetchItems = async catId => {
    const { data } = await api.get(
      `/lists/${listId}/categories/${catId}/items`
    );
    setItemsMap(m => ({ ...m, [catId]: data }));
  };

  // 4) Add new category
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

  // 5) Delete / rename category
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
    setCategories(c => c.map(x => x._id === id ? data : x));
    setEditingCatId(null);
  };

  // 6) Delete / edit item
  const deleteItem = async (catId, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(
      `/lists/${listId}/categories/${catId}/items/${itemId}`
    );
    fetchItems(catId);
  };

  // 7) DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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

  // Sortable column component
  function SortableColumn({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [local, setLocal] = useState(category.title);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex-shrink-0 m-2 w-64 bg-sand/20 rounded-lg p-3"
      >
        <div className="flex items-center mb-2">
          <FaGripVertical
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab text-pine"
          />
          {editingCatId === category._id ? (
            <input
              value={local}
              onChange={e => setLocal(e.target.value)}
              className="flex-1 border border-pine rounded p-1"
            />
          ) : (
            <h3 className="flex-1 font-semibold text-pine">
              {category.title}
            </h3>
          )}
          {editingCatId === category._id ? (
            <>
              <button
                onClick={() => saveCat(category._id, local)}
                className="text-teal mr-2"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingCatId(null)}
                className="text-ember"
              >
                ×
              </button>
            </>
          ) : (
            <>
              <FaEdit
                onClick={() => {
                  setEditingCatId(category._id);
                  setLocal(category.title);
                }}
                className="mr-2 cursor-pointer text-pine"
              />
              <FaTrash
                onClick={() => deleteCat(category._id)}
                className="cursor-pointer text-ember"
              />
            </>
          )}
        </div>

        <div className="flex flex-col h-48 overflow-auto space-y-2 mb-2">
          {itemsMap[category._id]?.map(item => (
            <GearItemCard
              key={item._id}
              item={item}
              onEdit={() =>
                setEditingItem({ categoryId: category._id, item })
              }
              onDelete={() => deleteItem(category._id, item._id)}
            />
          ))}
        </div>

        <button
          onClick={() => setShowAddModalCat(category._id)}
          className="h-12 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20"
        >
          <FaPlus />
          <span className="text-xs">Add Item</span>
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
    <div className="p-4 overflow-x-hidden">
      <h2 className="text-2xl font-bold text-pine mb-4">{listName}</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map(c => c._id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-nowrap overflow-x-auto">
            {categories.map(cat => (
              <SortableColumn key={cat._id} category={cat} />
            ))}

            {/* Add New Category */}
            <div className="flex-shrink-0 m-2 w-64">
              {addingNewCat ? (
                <div className="bg-sand/10 rounded-lg p-3 h-full flex flex-col">
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    className="border border-pine rounded p-1 mb-2"
                  />
                  <div className="flex justify-end space-x-2 mt-auto">
                    <button
                      onClick={cancelAddCat}
                      className="text-ember"
                    >
                      ×
                    </button>
                    <button
                      onClick={confirmAddCat}
                      className="text-teal"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNewCat(true)}
                  className="h-12 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20"
                >
                  <FaPlus />
                  <span className="text-xs">Add New Category</span>
                </button>
              )}
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Gear-Item Modal */}
      {/* {editingItem && (
        <GearItemModal
          listId={listId}
          categoryId={editingItem.categoryId}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSaved={() => fetchItems(editingItem.categoryId)}
        />
      )} */}
    </div>
  );
}
