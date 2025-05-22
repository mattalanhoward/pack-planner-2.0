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

export default function GearListView({ listId }) {
  const [listName, setListName] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Fetch and set list title
  useEffect(() => {
    async function fetchList() {
      try {
        // Fetch all lists and find this one (no dedicated GET /lists/:id endpoint)
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Handle drag end: update only moved category's position
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

  // CRUD handlers
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
      // Prepend and re-index positions
      setCategories(prev => [
        data,
        ...prev.map((c, i) => ({ ...c, position: i + 1 }))
      ]);
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

    // Sync localTitle when entering edit
    useEffect(() => {
      if (editingId === category._id) setLocalTitle(category.title);
    }, [editingId, category]);

    return (
      <div ref={setNodeRef} style={style} className="bg-gray-100 rounded p-2 m-2 w-64">
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
        <div className="h-48 bg-white rounded p-1 overflow-y-auto">
          {/* Items would render here */}
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
    </div>
  );
}