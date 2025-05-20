// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import GlobalItemModal from './GlobalItemModal';

export default function Sidebar({
  currentListId,
  onSelectList,
  onItemAdded
}) {
  const [collapsed, setCollapsed]       = useState(false);
  const [lists, setLists]               = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [items, setItems]               = useState([]);
  const [categories, setCategories]     = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    api.get('/lists').then(r => setLists(r.data));
  }, []);

  useEffect(() => {
    if (!currentListId) return;
    api.get(`/lists/${currentListId}/categories`).then(r => setCategories(r.data));
  }, [currentListId]);

  const fetchGlobalItems = () => {
    api.get('/global/items', { params: { search: searchQuery } })
       .then(r => setItems(r.data));
  };
  useEffect(fetchGlobalItems, [searchQuery]);

  const createList = () => {
    const title = newListTitle.trim();
    if (!title) return;
    api.post('/lists', { title }).then(r => {
      const { list, categories: seeded } = r.data;
      setLists(prev => [...prev, list]);
      onSelectList(list);
      setCategories(seeded);
      setNewListTitle('');
    });
  };

  const addToList = async item => {
    const cat = categories.find(c => c.title === item.category);
    if (!cat) {
      return alert(`Category "${item.category}" not found in this list.`);
    }
    const payload = {
      brand:       item.brand,
      itemType:    item.itemType,
      name:        item.name,
      description: item.description,
      weight:      item.weight,
      price:       item.price,
      link:        item.link,
      worn:        item.worn,
      consumable:  item.consumable,
      quantity:    item.quantity,
      position:    0
    };
    try {
      await api.post(
        `/lists/${currentListId}/categories/${cat._id}/items`,
        payload
      );
      onItemAdded();
    } catch {
      alert('Failed to add item');
    }
  };

  const sidebarWidthClass = collapsed ? 'w-5' : 'w-[20]';

  return (
    <div className="h-full flex">
      <div className={`relative bg-gray-200 transition-all duration-300 flex-none ${sidebarWidthClass}`}>
        {/* Collapse/Expand toggle */}
        <button
          className={`absolute top-4 ${
            collapsed ? '-right-4' : 'right-4'
          } bg-white border rounded-full p-1 shadow z-30`}
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {!collapsed && (
          <div className="h-full flex flex-col">
            {/* Gear Lists (1/3 height) */}
            <section className="p-4 flex-none h-1/3 flex flex-col">
              <h2 className="font-semibold mb-2">Gear Lists</h2>
              <div className="flex mb-2">
                <input
                  className="flex-1 p-1 border rounded"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  placeholder="New list"
                />
                <button
                  onClick={createList}
                  className="ml-1 p-2 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <ul>
                  {lists.map(list => (
                    <li
                      key={list._id}
                      className={`p-2 rounded hover:bg-gray-300 cursor-pointer ${
                        list._id === currentListId ? 'bg-gray-300' : ''
                      }`}
                      onClick={() => onSelectList(list)}
                    >
                      {list.title}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Gear Items (2/3 height) */}
            <section className="p-4 flex-none h-2/3 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Gear Items</h2>
                <button
                  onClick={() => currentListId && setShowModal(true)}
                  disabled={!currentListId}
                  className="p-1 disabled:opacity-50"
                >
                  <FaPlus />
                </button>
              </div>

              <input
                className="w-full p-1 border rounded mb-2"
                placeholder="Search items"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              {/* This wrapper will scroll vertically when the list grows */}
              <div className="flex-1 overflow-y-auto">
                <ul className="space-y-1">
                  {items.length > 0 ? (
                    items.map(item => {
                      const canAdd = categories.some(c => c.title === item.category);
                      return (
                        <li
                          key={item._id}
                          className="flex justify-between items-center p-2 hover:bg-gray-300"
                        >
                          <span>
                            {item.itemType} – {item.name}
                          </span>
                          <button
                            onClick={() => addToList(item)}
                            disabled={!canAdd}
                            className="p-1 bg-green-600 text-white rounded disabled:opacity-50"
                          >
                            <FaPlus />
                          </button>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-gray-500 p-2">No items</li>
                  )}
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* New Item Modal */}
        {showModal && (
          <GlobalItemModal
            categories={categories}
            onClose={() => setShowModal(false)}
            onCreated={fetchGlobalItems}
          />
        )}
      </div>
    </div>
  );
}
