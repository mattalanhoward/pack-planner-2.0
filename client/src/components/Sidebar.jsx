import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import GlobalItemModal from './GlobalItemModal';

export default function Sidebar({
  currentListId,
  onSelectList,
  onItemAdded
}) {
  const [collapsed, setCollapsed]     = useState(false);
  const [lists, setLists]             = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [items, setItems]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal]     = useState(false);

  // 1️⃣ Load all gear lists
  useEffect(() => {
    api.get('/lists').then(res => setLists(res.data));
  }, []);

  // 2️⃣ When a list is selected, fetch its categories
  useEffect(() => {
    if (!currentListId) return;
    api
      .get(`/lists/${currentListId}/categories`)
      .then(res => setCategories(res.data));
  }, [currentListId]);

  // 3️⃣ Fetch global items by name only
  const fetchGlobalItems = () => {
    api
      .get('/global/items', { params: { search: searchQuery } })
      .then(res => setItems(res.data));
  };
  useEffect(fetchGlobalItems, [searchQuery]);

  // 4️⃣ Create a new gear list (with auto-seeding)
  const createList = () => {
    if (!newListTitle.trim()) return;
    api.post('/lists', { title: newListTitle.trim() }).then(res => {
      const { list, categories: seeded } = res.data;
      setLists(prev => [...prev, list]);
      onSelectList(list);
      setCategories(seeded);
      setNewListTitle('');
    });
  };

  // 5️⃣ Add a global item into the current list (by matching on title)
  const addToList = async item => {
    const cat = categories.find(c => c.title === item.category);
    if (!cat) {
      return alert(
        `Category "${item.category}" not found in this list.`
      );
    }

    try {
      await api.post(
        `/lists/${currentListId}/categories/${cat._id}/items`,
        {
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
        }
      );
      onItemAdded();
      fetchGlobalItems();
    } catch (err) {
      console.error('Error adding item to list:', err);
      alert('Failed to add item to list');
    }
  };

  // Sidebar widths
  const sidebarWidthClass = collapsed ? 'w-5' : 'w-[20]';

  return (
    <div className="h-full flex">
      <div
        className={`relative bg-gray-200 transition-all duration-300 flex-none ${sidebarWidthClass}`}
      >
        {/* Collapse/Expand Button */}
        <button
          className="absolute top-4 -right-4 bg-white border rounded-full p-1 shadow"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {!collapsed && (
          <div className="h-full flex flex-col">
            {/* Gear Lists Section */}
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

            {/* Gear Items Section */}
            <section className="p-4 flex-1 flex flex-col">
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

              {/* Search */}
              <input
                className="w-full p-1 border rounded mb-2"
                placeholder="Search items"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              {/* Global Items List */}
              <ul className="flex-1 overflow-auto space-y-1">
                {items.length > 0 ? (
                  items.map(item => {
                    const canAdd = categories.some(
                      c => c.title === item.category
                    );
                    return (
                      <li
                        key={item._id}
                        className="flex justify-between p-2 hover:bg-gray-300"
                      >
                        <span>
                          {item.itemType} – {item.name}
                        </span>
                        <button
                          onClick={() => addToList(item)}
                          disabled={!canAdd}
                          className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                        >
                          Add
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-gray-500 p-2">No items</li>
                )}
              </ul>
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
