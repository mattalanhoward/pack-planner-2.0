import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DndContextWrapper } from '../components/DndContextWrapper';
import GearItemCard from '../components/GearItemCard';

export default function GearListView({ listId, refreshToggle }) {
  const [categories, setCategories]           = useState([]);
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');

  useEffect(() => {
    const loadBoard = async () => {
      if (!listId) return;
      setLoading(true);
      setError('');
      try {
        // 1️⃣ fetch columns
        const { data: cats } = await api.get(
          `/lists/${listId}/categories`
        );
        setCategories(cats);

        // 2️⃣ fetch items for each category in parallel
        const map = {};
        await Promise.all(
          cats.map(async (cat) => {
            const { data: items } = await api.get(
              `/lists/${listId}/categories/${cat._id}/items`
            );
            map[cat._id] = items;
          })
        );
        setItemsByCategory(map);
      } catch (err) {
        console.error('Error loading board:', err);
        setError('Failed to load board.');
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [listId, refreshToggle]);

  // Handle drag-and-drop reordering of columns
  const handleCategoryReorder = async (oldIndex, newIndex) => {
    const reordered = [...categories];
    const [moved]   = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setCategories(reordered);

    try {
      await api.patch(
        `/lists/${listId}/categories/${moved._id}/position`,
        { position: newIndex }
      );
    } catch (err) {
      console.error('Failed to reorder category:', err);
      // optionally revert UI change or show error
    }
  };

  if (loading) {
    return <div className="p-6">Loading board…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

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
                  <GearItemCard
                    key={item._id}
                    item={item}
                    onEdit={itm => {
                      // TODO: open edit modal for this item
                      console.log('Edit', itm);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </DndContextWrapper>
      </div>
    </div>
  );
}
