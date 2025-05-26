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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FaGripVertical,
  FaEdit,
  FaTrash,
  FaPlus,
  FaUtensils,
  FaTshirt,
} from 'react-icons/fa';
import AddGearItemModal from '../components/AddGearItemModal';

export default function GearListView({
  listId,
  refreshToggle,
  templateToggle,
  viewMode,     // "columns" or "list"
}) {
  const [listName, setListName]     = useState('');
  const [categories, setCategories] = useState([]);
  const [itemsMap, setItemsMap]     = useState({});
  const [editingCatId, setEditingCatId]   = useState(null);
  const [addingNewCat, setAddingNewCat]   = useState(false);
  const [newCatName, setNewCatName]       = useState('');
  const [showAddModalCat, setShowAddModalCat] = useState(null);

  // — fetch list title —
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get('/lists');
      const found = data.find(l => l._id === listId);
      setListName(found?.title || '');
    })();
  }, [listId]);

  // — load categories —
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get(`/lists/${listId}/categories`);
      setCategories(data);
    })();
  }, [listId, refreshToggle, templateToggle]);

  // — load items —
  useEffect(() => {
    categories.forEach(cat => fetchItems(cat._id));
  }, [categories, refreshToggle, templateToggle]);

  const fetchItems = async catId => {
    const { data } = await api.get(
      `/lists/${listId}/categories/${catId}/items`
    );
    setItemsMap(m => ({ ...m, [catId]: data }));
  };

  // — inline-edit handlers —
  const toggleConsumable = async (catId, itemId) => {
    const item = itemsMap[catId].find(i => i._id === itemId);
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { consumable: !item.consumable }
    );
    fetchItems(catId);
  };
  const toggleWorn = async (catId, itemId) => {
    const item = itemsMap[catId].find(i => i._id === itemId);
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { worn: !item.worn }
    );
    fetchItems(catId);
  };
  const updateQuantity = async (catId, itemId, qty) => {
    await api.patch(
      `/lists/${listId}/categories/${catId}/items/${itemId}`,
      { quantity: qty }
    );
    fetchItems(catId);
  };

  // — delete an item —
  const deleteItem = async (catId, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(
      `/lists/${listId}/categories/${catId}/items/${itemId}`
    );
    fetchItems(catId);
  };

  // — add / cancel / delete / rename category —
  const confirmAddCat = async () => {
    const title = newCatName.trim();
    if (!title) return;
    const { data } = await api.post(
      `/lists/${listId}/categories`,
      { title, position: categories.length }
    );
    setCategories(c => [...c, data]);
    setNewCatName('');
    setAddingNewCat(false);
  };
  const cancelAddCat = () => setAddingNewCat(false);
  const deleteCat = async id => {
    if (!window.confirm('Delete this category?')) return;
    await api.delete(`/lists/${listId}/categories/${id}`);
    setCategories(c => c.filter(x => x._id !== id));
    setItemsMap(m => {
      const copy = { ...m };
      delete copy[id];
      return copy;
    });
  };
  const saveCat = async (id, title) => {
    const { data } = await api.patch(
      `/lists/${listId}/categories/${id}`,
      { title }
    );
    setCategories(c => c.map(x => (x._id === id ? data : x)));
    setEditingCatId(null);
  };

  // — DnD sensors & handler (shared) —
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const handleDragEnd = async ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldI = categories.findIndex(c => c._id === active.id);
      const newI = categories.findIndex(c => c._id === over.id);
      const reordered = arrayMove(categories, oldI, newI)
        .map((c, idx) => ({ ...c, position: idx }));
      setCategories(reordered);
      await api.patch(
        `/lists/${listId}/categories/${active.id}/position`,
        { position: newI }
      );
    }
  };

  // — Column mode: sortables —
  function SortableColumn({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const catId = category._id;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="snap-center flex-shrink-0 m-2 w-64 bg-sand/20 rounded-lg p-3 flex flex-col h-full"
      >
        {/* header */}
        <div className="flex items-center mb-2">
          <FaGripVertical {...attributes} {...listeners}
            className="mr-2 cursor-grab text-pine"/>
          <h3 className="flex-1 font-semibold text-pine">
            {category.title}
          </h3>
          <FaEdit
            onClick={() => setEditingCatId(category._id)}
            className="mr-2 cursor-pointer text-teal"
          />
          <FaTrash
            onClick={() => deleteCat(catId)}
            className="cursor-pointer text-ember"
          />
        </div>

        {/* items */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {(itemsMap[catId] || []).map(item => (
            <div
              key={item._id}
              className="bg-white p-3 rounded shadow flex flex-col"
            >
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-800">
                  {item.itemType || '—'}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {item.brand && <span className="mr-1">{item.brand}</span>}
                  {item.name}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                <span>{item.weight != null ? `${item.weight}g` : ''}</span>
                <div className="flex items-center space-x-3">
                  <FaUtensils
                    onClick={() => toggleConsumable(catId, item._id)}
                    className={`cursor-pointer ${
                      item.consumable ? 'text-green-600' : 'opacity-30'
                    }`}
                  />
                  <FaTshirt
                    onClick={() => toggleWorn(catId, item._id)}
                    className={`cursor-pointer ${
                      item.worn ? 'text-blue-600' : 'opacity-30'
                    }`}
                  />
                  <select
                    value={item.quantity}
                    onChange={e =>
                      updateQuantity(catId, item._id, Number(e.target.value))
                    }
                    className="border rounded p-1"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>
                        {i+1}
                      </option>
                    ))}
                  </select>
                  <FaTrash
                    onClick={() => deleteItem(catId, item._id)}
                    className="cursor-pointer text-red-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* add item */}
        <button
          onClick={() => setShowAddModalCat(catId)}
          className="h-12 w-full border border-teal rounded flex items-center justify-center space-x-2 text-teal hover:bg-teal/10"
        >
          <FaPlus /><span className="text-xs">Add Item</span>
        </button>

        {showAddModalCat === catId && (
          <AddGearItemModal
            listId={listId}
            categoryId={catId}
            onClose={() => setShowAddModalCat(null)}
            onAdded={() => fetchItems(catId)}
          />
        )}
      </div>
    );
  }

  // — List mode: sortables & one-line desktop / two-line mobile cards —
  function SortableSection({ category }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: category._id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const catId = category._id;

    return (
      <section
        ref={setNodeRef}
        style={style}
        className="bg-sand/20 rounded-lg p-4 mb-6"
      >
        {/* header */}
        <div className="flex items-center mb-3">
          <FaGripVertical {...attributes} {...listeners}
            className="mr-2 cursor-grab text-pine" />
          <h3 className="flex-1 font-semibold text-pine">{category.title}</h3>
          <FaEdit
            onClick={() => setEditingCatId(catId)}
            className="mr-2 cursor-pointer text-teal"
          />
          <FaTrash
            onClick={() => deleteCat(catId)}
            className="cursor-pointer text-ember"
          />
        </div>

        {/* items */}
        {(itemsMap[catId] || []).map(item => (
          <div
            key={item._id}
            className="
              bg-white rounded shadow p-4 mb-2
              flex flex-col space-y-2
              md:flex-row md:justify-between md:space-y-0 md:items-center
            "
          >
            {/* left: type, brand, name, description */}
            <div className="flex-1 flex flex-wrap items-center space-x-2">
              <span className="font-semibold">{item.itemType}</span>
              <span>{item.brand}</span>
              <span>{item.name}</span>
              <span className="hidden md:inline">— {item.description}</span>
            </div>

            {/* right: weight, toggles, price, qty, delete */}
            <div className="flex items-center space-x-3">
              <span>{item.weight != null ? `${item.weight}g` : ''}</span>
              <FaUtensils
                onClick={() => toggleConsumable(catId, item._id)}
                className={`cursor-pointer ${
                  item.consumable ? 'text-green-600' : 'opacity-30'
                }`}
              />
              <FaTshirt
                onClick={() => toggleWorn(catId, item._id)}
                className={`cursor-pointer ${
                  item.worn ? 'text-blue-600' : 'opacity-30'
                }`}
              />
              {item.price != null && (
                item.link ? (
                  <a href={item.link}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-teal hover:underline"
                  >
                    ${item.price}
                  </a>
                ) : (
                  <span>${item.price}</span>
                )
              )}
              <select
                value={item.quantity}
                onChange={e =>
                  updateQuantity(catId, item._id, Number(e.target.value))
                }
                className="border rounded p-1"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <FaTrash
                onClick={() => deleteItem(catId, item._id)}
                className="cursor-pointer text-ember"
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowAddModalCat(catId)}
          className="mt-2 px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Add Item
        </button>

        {showAddModalCat === catId && (
          <AddGearItemModal
            listId={listId}
            categoryId={catId}
            onClose={() => setShowAddModalCat(null)}
            onAdded={() => fetchItems(catId)}
          />
        )}
      </section>
    );
  }

  // — main render —
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="px-4 pt-4 text-2xl font-bold text-pine">{listName}</h2>

      {viewMode === 'list' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(c => c._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {categories.map(cat => (
                <SortableSection key={cat._id} category={cat} />
              ))}

              {/* bottom “Add New Category” */}
              <div className="px-4 mt-4">
                {addingNewCat ? (
                  <div className="flex items-center bg-sand p-3 rounded-lg space-x-2">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 border border-pine rounded p-2 bg-sand text-pine"
                    />
                    <button onClick={cancelAddCat} className="text-ember">×</button>
                    <button onClick={confirmAddCat} className="text-teal">✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNewCat(true)}
                    className="px-4 py-2 border border-pine rounded hover:bg-sand/20 flex items-center"
                  >
                    <FaPlus className="mr-2" /> Add New Category
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(c => c._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex-1 flex flex-nowrap overflow-x-auto px-4 py-2 snap-x snap-mandatory">
              {categories.map(cat => (
                <SortableColumn key={cat._id} category={cat} />
              ))}

              {/* Add New Category column */}
              <div className="snap-center flex-shrink-0 m-2 w-64 flex flex-col h-full">
                {addingNewCat ? (
                  <div className="bg-sand/20 rounded-lg p-3 flex items-center space-x-2">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 border border-pine rounded p-2 bg-sand text-pine"
                    />
                    <button onClick={cancelAddCat} className="text-ember p-1">×</button>
                    <button onClick={confirmAddCat} className="text-teal p-1">✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNewCat(true)}
                    className="h-12 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20"
                  >
                    <FaPlus /><span className="text-xs">Add New Category</span>
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
