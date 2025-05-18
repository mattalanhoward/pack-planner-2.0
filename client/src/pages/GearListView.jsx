// src/pages/GearListView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { DndContextWrapper } from '../components/DndContextWrapper';

export default function GearListView() {
  const { listId } = useParams();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const resp = await api.get(`/lists/${listId}/categories`);
      setCategories(resp.data);
    }
    fetchCategories();
  }, [listId]);

  const handleCategoryReorder = async (oldIndex, newIndex) => {
    const reordered = [...categories];
    arrayMove(reordered, oldIndex, newIndex);
    setCategories(reordered);
    await api.patch(
      `/lists/${listId}/categories/${reordered[newIndex]._id}/position`,
      { position: newIndex }
    );
  };

  return (
    <div className="p-6">
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        &larr; Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold my-4">Gear List</h1>
      <div className="flex space-x-4 overflow-x-auto">
        <DndContextWrapper
          items={categories.map(c => c._id)}
          onDragEnd={handleCategoryReorder}
        >
          {categories.map(cat => (
            <div
              key={cat._id}
              id={cat._id}
              className="w-64 bg-gray-100 p-3 rounded"
            >
              <h2 className="font-semibold mb-2">{cat.title}</h2>
              {/* TODO: map items here */}
            </div>
          ))}
        </DndContextWrapper>
      </div>
    </div>
  );
}
