import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DndContextWrapper } from '../components/DndContextWrapper';

export default function GearListView({ listId, refreshToggle }) {
  const [categories, setCategories]         = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});

  useEffect(() => {
    async function loadBoard() {
      if (!listId) return;

      // 1️⃣ fetch columns
      const { data: cats } = await api.get(
        `/lists/${listId}/categories`
      );
      setCategories(cats);

      // 2️⃣ fetch items for each category
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
    }
    loadBoard();
  }, [listId, refreshToggle]);

  // Handle drag-and-drop reordering of columns
  const handleCategoryReorder = async (oldIndex, newIndex) => {
    const reordered = [...categories];
    const [moved]   = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setCategories(reordered);

    await api.patch(
      `/lists/${listId}/categories/${moved._id}/position`,
      { position: newIndex }
    );
  };

  return (
    <div className="p-6">
      <Link to="/dashboard" className="text-blue-500 hover:underline">
        &larr; Back to dashboard
      </Link>

      <div className="flex space-x-4 overflow-x-auto mt-4">
        <DndContextWrapper
          items={categories.map(c => c._id)}
          onDragEnd={handleCategoryReorder}
        >
          {categories.map(cat => (
            <div
              key={cat._id}
              id={cat._id}
              className="w-64 bg-gray-100 p-3 rounded flex flex-col"
            >
              <h2 className="font-semibold mb-2">{cat.title}</h2>
              <div className="flex-1 overflow-auto space-y-2">
                {(itemsByCategory[cat._id] || []).map(item => (
                  <div
                    key={item._id}
                    className="bg-white p-2 rounded shadow"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DndContextWrapper>
      </div>
    </div>
  );
}
