// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaChevronLeft, FaChevronRight, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import GlobalItemModal from './GlobalItemModal';

export default function Sidebar({ currentListId, onSelectList, onItemAdded }) {
  const [collapsed, setCollapsed]       = useState(false);
  const [lists, setLists]               = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [editingId, setEditingId]       = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [items, setItems]               = useState([]);
  const [categories, setCategories]     = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showModal, setShowModal]       = useState(false);

  // Fetch all gear lists
  const fetchLists = async () => {
    try {
      const { data } = await api.get('/lists');
      setLists(data);
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  // Fetch global items
  const fetchGlobalItems = async () => {
    try {
      const { data } = await api.get('/global/items', { params: { search: searchQuery } });
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Auto-select first list
  useEffect(() => {
    if (!currentListId && lists.length) {
      onSelectList(lists[0]._id);
    }
  }, [lists, currentListId, onSelectList]);

  // Fetch categories for selected list
  useEffect(() => {
    if (!currentListId) return;
    api.get(`/lists/${currentListId}/categories`)
       .then(r => setCategories(r.data))
       .catch(err => console.error('Error fetching categories:', err));
  }, [currentListId]);

  useEffect(() => {
    fetchGlobalItems();
  }, [searchQuery]);

  // Create a new gear list
  const createList = async () => {
    const title = newListTitle.trim();
    if (!title) return;
    try {
      const {
        data: { list, categories: seeded }
      } = await api.post('/lists', { title });
      setNewListTitle('');
      setLists(prev => [...prev, list]);
      onSelectList(list._id);
      setCategories(seeded);
    } catch (err) {
      console.error('Error creating list:', err);
      alert('Could not create list');
    }
  };

  // Inline editing
  const startEdit = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };
  const saveEdit = async id => {
    const title = editingTitle.trim();
    if (!title) return;
    try {
      const { data: updated } = await api.patch(`/lists/${id}`, { title });
      setEditingId(null);
      setEditingTitle('');
      setLists(prev => prev.map(l => (l._id === id ? updated : l)));
      if (currentListId === id) onSelectList(id);
    } catch (err) {
      console.error('Error updating list:', err);
      alert('Could not update list');
    }
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Delete list
  const deleteList = async id => {
    if (!window.confirm('Delete this gear list? This cannot be undone.')) return;
    try {
      await api.delete(`/lists/${id}`);
      setLists(prev => prev.filter(l => l._id !== id));
      if (currentListId === id) onSelectList(null);
    } catch (err) {
      console.error('Error deleting list:', err);
      alert('Could not delete list');
    }
  };

  // Add a global item
  const addToList = async item => {
    let cat = categories.find(c => c._id === item.category?._id);
    if (!cat && categories.length) cat = categories[0];
    if (!cat) return alert('No category available to add item to');
    // Exclude metadata fields from payload (_id, category, timestamps)
    const { _id, category: _cat, __v, createdAt, updatedAt, ...rest } = item;
    const payload = { ...rest, position: 0 };

    try {
      await api.post(
        `/lists/${currentListId}/categories/${cat._id}/items`,
        payload
      );
      onItemAdded();
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Could not add item');
    }
  };

  const widthClass = collapsed ? 'w-6' : 'w-64';

  return (
    <div className="h-full flex">
      <div className={`relative bg-gray-100 transition-all ${widthClass}`}>        
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {!collapsed && (
          <div className="h-full flex flex-col">
            {/* Gear Lists */}
            <section className="flex flex-col h-1/3 p-4 border-b">
              <h2 className="font-semibold mb-2">Gear Lists</h2>
              <div className="flex mb-2">
                <input
                  className="flex-1 border rounded p-1"
                  placeholder="New list"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                />
                <button
                  onClick={createList}
                  disabled={!newListTitle.trim()}
                  className="ml-2 p-1 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
              <ul className="overflow-y-auto flex-1 space-y-1">
                {lists.map(list => (
                  <li key={list._id} className="flex items-center">
                    {editingId === list._id ? (
                      <>
                        <input className="flex-1 border rounded p-1" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} />
                        <button onClick={() => saveEdit(list._id)} className="ml-2 p-1 text-green-600">Save</button>
                        <button onClick={cancelEdit} className="ml-1 p-1 text-gray-600">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectList(list._id)}
                          className={`flex-1 text-left p-1 rounded ${
                            list._id === currentListId ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                          }`}
                        >
                          {list.title}
                        </button>
                        <FaEdit onClick={() => startEdit(list._id, list.title)} className="ml-2 cursor-pointer text-gray-600" />
                        <FaTrash onClick={() => deleteList(list._id)} className="ml-2 cursor-pointer text-red-600" />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Gear Items */}
            <section className="flex flex-col h-2/3 p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Gear Items</h2>
                <button onClick={() => currentListId && setShowModal(true)} disabled={!currentListId || !categories.length} className="p-1 disabled:opacity-50">
                  <FaPlus />
                </button>
              </div>

              <input
                className="w-full border rounded p-1 mb-2"
                placeholder="Search items"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <div className="overflow-y-auto flex-1">
                <ul className="space-y-1">
                  {items.length > 0 ? (
                    items.map(item => {
                      const canAdd = !!categories.length;
                      return (
                        <li key={item._id} className="flex justify-between items-center p-1 hover:bg-gray-200">
                          <span>{item.itemType} – {item.name}</span>
                          <button onClick={() => addToList(item)} disabled={!canAdd} className="p-1 bg-green-600 text-white rounded disabled:opacity-50">
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

              {showModal && (
                <GlobalItemModal
                  categories={categories}
                  onClose={() => setShowModal(false)}
                  onCreated={fetchGlobalItems}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
