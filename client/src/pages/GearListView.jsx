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

export default function GearListView({ listId }) {
  const [listName, setListName] = useState('');
  const [categories, setCategories] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showItemModalCat, setShowItemModalCat] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch and set list name via GET /lists
  useEffect(() => {
    async function fetchList() {
      try {
        const { data } = await api.get('/lists');
        const list = data.find(l => l._id === listId);
        setListName(list ? list.title : '');
      } catch (err) {
        console.error('Error fetching list name:', err);
      }
    }
    if (listId) fetchList();
  }, [listId]);

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get(`/lists/${listId}/categories`);
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    if (listId) fetchCategories();
  }, [listId]);

  // Load items for each category
  useEffect(() => {
    categories.forEach(cat => {
      fetchItems(cat._id);
    });
  }, [categories]);

  const fetchItems = async catId => {
    try {
      const { data } = await api.get(
        `/lists/${listId}/categories/${catId}/items`
      );
      setItemsMap(prev => ({ ...prev, [catId]: data }));
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const deleteItem = async (catId, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(
        `/lists/${listId}/categories/${catId}/items/${itemId}`
      );
      fetchItems(catId);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Handle drag end: update moved category position
  const handleDragEnd = async ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c._id === active.id);
      const newIndex = categories.findIndex(c => c._id === over.id);
      const newCats = arrayMove(categories, oldIndex, newIndex).map((c, idx) => ({ ...c, position: idx }));
      setCategories(newCats);
      try {
        await api.patch(
          `/lists/${listId}/categories/${active.id}/position`,
          { position: newIndex }
        );
      } catch (err) {
        console.error('Error updating category position:', err);
      }
    }
  };

  // CRUD handlers for categories
  const startEdit = id => setEditingId(id);
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id, title) => {
    try {
      const { data: updated } = await api.patch(
        `/lists/${listId}/categories/${id}`,
        { title }
      );
      setCategories(prev => prev.map(c => c._id === id ? updated : c));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating category title:', err);
    }
  };
  const deleteCategory = async id => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/lists/${listId}/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      setItemsMap(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // Add new category at top
  const addCategoryTop = async () => {
    const title = newTitle.trim() || 'New Category';
    try {
      const { data } = await api.post(
        `/lists/${listId}/categories`,
        { title, position: 0 }
      );
      setCategories(prev => [data, ...prev.map((c, i) => ({ ...c, position: i + 1 }))]);
      setNewTitle('');
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  // Sortable column component
  function SortableColumn({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [localTitle, setLocalTitle] = useState(category.title);

    useEffect(() => {
      if (editingId === category._id) setLocalTitle(category.title);
    }, [editingId, category]);

    // Handler to open gear-item edit modal
    const handleItemEdit = item => {
      setEditingItem({ categoryId: category._id, item });
    };

    return (
      <div ref={setNodeRef} style={style} className="bg-gray-100 rounded p-2 m-2 w-64 flex-shrink-0">
        <div className="flex items-center mb-2">
          <FaGripVertical {...attributes} {...listeners} className="mr-2 cursor-grab" />
          {editingId === category._id ? (
            <input
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              className="flex-1 border rounded p-1 mr-2"
              autoFocus
            />
          ) : (
            <h3 className="flex-1 font-semibold">{category.title}</h3>
          )}
          {editingId === category._id ? (
            <>
              <button onClick={() => saveEdit(category._id, localTitle)} className="mr-1 text-green-600">✓</button>
              <button onClick={cancelEdit} className="text-gray-600">×</button>
            </>
          ) : (
            <>
              <FaEdit onClick={() => startEdit(category._id)} className="mr-2 cursor-pointer text-gray-600" />
              <FaTrash onClick={() => deleteCategory(category._id)} className="mr-2 cursor-pointer text-red-600" />
            </>
          )}
        </div>
        <div className="h-48 bg-white rounded p-1 overflow-y-auto flex flex-col">
          {/* Render gear items */}
          {itemsMap[category._id]?.map(item => (
            <GearItemCard
              key={item._id}
              item={item}
              onEdit={handleItemEdit}
              onDelete={() => deleteItem(category._id, item._id)}
            />
          ))}
          {/* Add-new button at column bottom */}
<button
  onClick={() => setShowItemModalCat(category._id)}
  className="mt-auto p-1 bg-green-600 text-white rounded"
>
  <FaPlus /> Add Item
</button>

{/* Board-scoped AddGearItemModal */}
{showItemModalCat === category._id && (
  <AddGearItemModal
    listId={listId}
    categoryId={category._id}
    onClose={() => setShowItemModalCat(null)}
    onAdded={() => fetchItems(category._id)}
  />
)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Display current list name */}
      <h2 className="text-2xl font-semibold mb-2">{listName}</h2>

      {/* Top-left add category */}
      <div className="flex items-center mb-4">
        <input
          className="border rounded p-1 mr-2"
          placeholder="New category"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <button onClick={addCategoryTop} className="p-1 bg-blue-600 text-white rounded">
          <FaPlus />
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map(c => c._id)} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-nowrap overflow-x-auto">
            {categories.map(category => (
              <SortableColumn key={category._id} category={category} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Gear-item edit modal */}
      {editingItem && (
        <GearItemModal
          listId={listId}
          categoryId={editingItem.categoryId}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSaved={() => fetchItems(editingItem.categoryId)}
        />
      )}
    </div>
  );
}