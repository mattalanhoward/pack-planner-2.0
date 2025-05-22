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
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await api.get(`/lists/${listId}/categories`);
      setCategories(data);
    }
    fetchCategories();
  }, [listId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Handle drag end: update only moved category position
  const handleDragEnd = async ({ active, over }) => {
    if (active.id !== over.id) {
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
    await api.patch(`/lists/${listId}/categories/${id}`, { title });
    setEditingId(null);
    setCategories(prev => prev.map(c => c._id === id ? { ...c, title } : c));
  };
  const deleteCategory = async id => {
    if (!window.confirm('Delete this category?')) return;
    await api.delete(`/lists/${listId}/categories/${id}`);
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  // Add new category at top left
  const addCategoryTop = async () => {
    const title = newTitle.trim() || 'New Category';
    const position = 0;
    const { data } = await api.post(`/lists/${listId}/categories`, { title, position });
    setCategories(prev => [data, ...prev.map((c, i) => ({ ...c, position: i + 1 }))]);
    setNewTitle('');
  };

  // Sortable column component
  function SortableColumn({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const [localTitle, setLocalTitle] = useState(category.title);

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
        {/* Placeholder for items */}
        <div className="h-48 bg-white rounded p-1">...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
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
          <div className="flex overflow-x-auto">
            {categories.map(category => <SortableColumn key={category._id} category={category} />)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}