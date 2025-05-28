// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaEdit,
  FaTrash,
} from 'react-icons/fa';
import GlobalItemModal from './GlobalItemModal';
import GlobalItemEditModal from './GlobalItemEditModal';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

export default function Sidebar({
  currentListId,
  onSelectList,
  onItemAdded,
  onTemplateEdited,      // <— new prop
}) {
  const [collapsed, setCollapsed]         = useState(false);
  const [lists, setLists]                 = useState([]);
  const [newListTitle, setNewListTitle]   = useState('');
  const [editingId, setEditingId]         = useState(null);
  const [editingTitle, setEditingTitle]   = useState('');
  const [categories, setCategories]       = useState([]);
  const [items, setItems]                 = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [showCreateModal, setShowCreateModal]     = useState(false);
  const [editingGlobalItem, setEditingGlobalItem] = useState(null);

  // 1) Fetch all gear lists
  const fetchLists = async () => {
    try {
      const { data } = await api.get('/lists');
      setLists(data);
    } catch (err) {
      console.error('Error fetching lists:', err);
      alert('Failed to load your gear lists.');
    }
  };

  // 2) Fetch all global items (master catalog)
  const fetchGlobalItems = async () => {
    try {
      const { data } = await api.get('/global/items', {
        params: { search: searchQuery }
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching global items:', err);
      alert('Failed to load catalog items.');
    }
  };

  // 3) On mount, load lists
  useEffect(() => {
    fetchLists();
  }, []);

  // 4) Auto-select first list if none
  useEffect(() => {
    if (!currentListId && lists.length > 0) {
      onSelectList(lists[0]._id);
    }
  }, [lists, currentListId, onSelectList]);

  // 5) Load categories when list changes
  useEffect(() => {
    if (!currentListId) {
      setCategories([]);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/lists/${currentListId}/categories`);
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    })();
  }, [currentListId]);

  // 6) Reload catalog on search change
  useEffect(() => {
    fetchGlobalItems();
  }, [searchQuery]);

   // === Gear‐list CRUD ===

  // Create
  const createList = async () => {
    const title = newListTitle.trim();
    if (!title) {
      toast.error('List name cannot be empty.');
      return;
    }
    try {
      await api.post('/lists', { title });
      setNewListTitle('');
      await fetchLists();
      toast.success('List created!');
    } catch (err) {
      console.error('Error creating list:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.response?.data?.message || 'Could not create list.',
      });
    }
  };

  // Start inline edit
  const startEditList = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  // Save inline edit
  const saveEditList = async id => {
    const title = editingTitle.trim();
    if (!title) {
      toast.error('List name cannot be empty.');
      return;
    }
    try {
      await api.patch(`/lists/${id}`, { title });
      setEditingId(null);
      setEditingTitle('');
      await fetchLists();
      if (currentListId === id) onSelectList(id);
      toast.success('List renamed!');
    } catch (err) {
      console.error('Error updating list:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not update list name.',
      });
    }
  };
  const cancelEditList = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  // Delete
  const deleteList = async id => {
    const list = lists.find(l => l._id === id);
    const result = await Swal.fire({
      title: `Delete ${list.title} Gear List?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/lists/${id}`);
      await fetchLists();
      if (currentListId === id) onSelectList(null);
      toast.success('List deleted');
    } catch (err) {
      console.error('Error deleting list:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: 'Could not delete list.',
      });
    }
  };

  // === Global‐item (catalog) actions ===

  const addToList = async item => {
    if (!currentListId || categories.length === 0) {
      return alert('Pick or create a list with at least one category first.');
    }
    const cat = categories[0]; // default to first category

    const payload = {
      globalItem:  item._id,
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
    } catch (err) {
      console.error('Error adding catalog item to list:', err);
      alert('Failed to add item into your list.');
    }
  };

   // — delete an item —
  
  const deleteGlobalItem = async id => {
    const item = items.find(i => i._id === id);
          const result = await Swal.fire({
        title: `Delete ${item.brand} ${item.name} and all its instances?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete Item',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;
    try {
      await api.delete(`/global/items/${id}`);
      fetchGlobalItems();
      onTemplateEdited();     // <— notify boards to refresh
      toast.success('Item deleted');

    } catch (err) {
      console.error('Error deleting global item:', err);
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // === Presentation ===

  const widthClass = collapsed ? 'w-5' : 'w-80';

  return (
 <div className="h-full flex overflow-visible">
      <div className={`relative bg-teal text-sand transition-all duration-300 ${widthClass}`}>        
        {/* Collapse toggle at border, half in/out when collapsed */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={
            `absolute top-4 bg-ember text-pine rounded-full p-1 shadow-lg transform ` +
            (collapsed ? 'right-0 translate-x-1/2' : 'right-4')
          }
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {!collapsed && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Gear Lists */}
            <section className="flex flex-col flex-none h-1/3 p-4 border-b border-sand overflow-hidden">
              <h2 className="font-bold mb-2 text-sunset">Gear Lists</h2>
              <div className="flex mb-3">
                <input
                  className="flex-1 rounded-lg p-2 bg-sand text-pine border-pine"
                  placeholder="New list"
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                />
                <button
                  onClick={createList}
                  disabled={!newListTitle.trim()}
                  className="ml-2 px-4 bg-sunset text-pine rounded-lg shadow hover:bg-sunset/80"
                >
                  Create
                </button>
              </div>
              <ul className="overflow-y-auto flex-1 space-y-1">
                {lists.map(l => (
                  <li key={l._id} className="flex items-center">
                    {editingId === l._id ? (
                      <>
                        <input
                          className="flex-1 rounded-lg p-1 text-pine hover:text-pine/80"
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                        />
                        <button onClick={() => saveEditList(l._id)} className="ml-2 text-sunset">
                          ✓
                        </button>
                        <button onClick={cancelEditList} className="ml-1 text-ember">
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectList(l._id)}
                          className={`flex-1 text-left p-2 rounded-lg ${
                            l._id === currentListId
                              ? 'bg-teal text-sand'
                              : 'hover:bg-sunset hover:text-pine'
                          }`}
                        >
                          {l.title}
                        </button>
                        <FaEdit
                          onClick={() => startEditList(l._id, l.title)}
                          className="ml-2 cursor-pointer text-sunset"
                        />
                        <FaTrash
                          onClick={() => deleteList(l._id)}
                          className="ml-2 cursor-pointer text-ember"
                        />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Catalog / Global Items */}
            <section className="flex flex-col flex-1 p-4 overflow-hidden">
              <div className="flex justify-between items-center mb-2 text-sunset">
                <h2 className="font-bold">Catalog</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1"
                  disabled={!currentListId || categories.length === 0}
                >
                  <FaPlus />
                </button>
              </div>

              <input
                className="w-full rounded-lg p-2 bg-sand text-pine border border-pine mb-3"
                placeholder="Search catalog"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <ul className="overflow-y-auto flex-1 space-y-2">
                {items.length > 0 ? (
                  items.map(item => (
<li
  key={item._id}
  className="flex items-center p-2 bg-sand/10 rounded-lg hover:bg-sand/20"
>
  {/* left: truncated text */}
  <span className="flex-1 truncate text-sand">
    {item.itemType} – {item.name}
  </span>

  {/* right: action buttons */}
  <div className="flex items-center space-x-2 ml-4">
    <button
      onClick={() => setEditingGlobalItem(item)}
      title="Edit global template"
      className="hover:text-sand/80 text-sand rounded-lg "
    >
      <FaEdit />
    </button>
    <button
      onClick={() => deleteGlobalItem(item._id)}
      title="Delete global template"
      className="text-ember hover:text-ember/80"
    >
      <FaTrash />
    </button>
    <button
      onClick={() => addToList(item)}
      disabled={!categories.length}
      title="Add item to list"
      className="p-1  hover:text-sunset/80 text-sunset rounded-lg disabled:opacity-50"
    >
      <FaPlus />
    </button>
  </div>
</li>

                  ))
                ) : (
                  <li className="text-pine/70 p-2">No catalog items</li>
                )}
              </ul>

              {showCreateModal && (
                <GlobalItemModal
                  categories={categories}
                  onClose={() => { setShowCreateModal(false); fetchGlobalItems(); }}
                  onCreated={() => { setShowCreateModal(false); fetchGlobalItems(); onTemplateEdited(); }}
                />
              )}

              {editingGlobalItem && (
                <GlobalItemEditModal
                  item={editingGlobalItem}
                  onClose={() => setEditingGlobalItem(null)}
                  onSaved={() => {
                    fetchGlobalItems();
                    setEditingGlobalItem(null);
                    onTemplateEdited();   // <— notify Dashboard
                  }}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
