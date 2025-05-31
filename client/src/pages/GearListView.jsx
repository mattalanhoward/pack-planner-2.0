// src/pages/GearListView.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates
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
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

import SortableItem from '../components/SortableItem';

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

  // — inline‐edit handlers for items —
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
    const result = await Swal.fire({
      title: 'Delete this item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/lists/${listId}/categories/${catId}/items/${itemId}`);
      fetchItems(catId);
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // — add category —
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
    toast.success('Category Added! 🎉');
  };
  const cancelAddCat = () => setAddingNewCat(false);

  // — delete category —
  const deleteCat = async id => {
    const result = await Swal.fire({
      title: 'Delete this category?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/lists/${listId}/categories/${id}`);
      setCategories(c => c.filter(x => x._id !== id));
      setItemsMap(m => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // — edit category name inline —
  const editCat = async (id, title) => {
    const newTitle = title.trim();
    if (!newTitle) {
      toast.error('Category name cannot be empty');
      return;
    }
    try {
      const { data } = await api.patch(
        `/lists/${listId}/categories/${id}`,
        { title: newTitle }
      );
      setCategories(cats =>
        cats.map(c => (c._id === id ? data : c))
      );
      setEditingCatId(null);
      toast.success('Category renamed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename category');
    }
  };

  // — DnD sensors & handler —
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // const handleDragEnd = async ({ active, over }) => {
  //   if (over && active.id !== over.id) {
  //     const oldI = categories.findIndex(c => c._id === active.id);
  //     const newI = categories.findIndex(c => c._id === over.id);
  //     const reordered = arrayMove(categories, oldI, newI)
  //       .map((c, idx) => ({ ...c, position: idx }));
  //     setCategories(reordered);
  //     await api.patch(
  //       `/lists/${listId}/categories/${active.id}/position`,
  //       { position: newI }
  //     );
  //   }
  // };
  // We will need to know, on dragEnd, whether we're sorting a category or an item.
  // To do that, we will namespace all category IDs as `cat-<catId>`, and item IDs as `item-<catId>-<itemId>`
  // So: if active.id startsWith('cat-') ⇒ reorder categories; else if startsWith('item-') ⇒ reorder items

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return; // if dropped outside anywhere, do nothing

    // 1) CATEGORY DRAG:
    if (active.id.startsWith('cat-') && over.id.startsWith('cat-')) {
      // extract the raw IDs out of our namespaced strings
      const oldCatIndex = categories.findIndex(
        (c) => `cat-${c._id}` === active.id
      );
      const newCatIndex = categories.findIndex(
        (c) => `cat-${c._id}` === over.id
      );
      if (oldCatIndex !== -1 && newCatIndex !== -1 && oldCatIndex !== newCatIndex) {
        const reorderedCats = arrayMove(categories, oldCatIndex, newCatIndex)
          .map((c, idx) => ({ ...c, position: idx }));
        setCategories(reorderedCats);
        // Persist to server: only PATCH the one moved category to its new position
        const movedCat = reorderedCats[newCatIndex];
        await api.patch(
          `/lists/${listId}/categories/${movedCat._id}/position`,
          { position: newCatIndex }
        );
      }
      return;
    }

    // 2) ITEM DRAG:
    if (active.id.startsWith('item-') && over.id.startsWith('item-')) {
      // Parse out source catId + itemId from active.id = `item-<catId>-<itemId>`
      const [ , sourceCatId, sourceItemId ] = active.id.split('-');
      // Similarly, destination catId + destItemId:
      const [ , destCatId, destItemId ] = over.id.split('-');

      // If sourceCatId === destCatId, we're merely reordering _within_ the same category
      if (sourceCatId === destCatId) {
        const oldArray = itemsMap[sourceCatId] || [];
        const oldIndex = oldArray.findIndex(i => i._id === sourceItemId);
        const newIndex = oldArray.findIndex(i => i._id === destItemId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newArr = arrayMove(oldArray, oldIndex, newIndex)
            .map((itemObj, idx) => ({ ...itemObj, position: idx }));
          // 1) Immediately update UI:
          setItemsMap(prev => ({
            ...prev,
            [sourceCatId]: newArr
          }));
          // 2) Persist each changed position to server:
          for (let i = 0; i < newArr.length; i++) {
            const it = newArr[i];
            // Only PATCH if the position truly changed:
            if (it.position !== oldArray.find(x => x._id === it._id).position) {
              await api.patch(
                `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
                { position: i }
              );
            }
          }
        }
      } else {
        // Cross‐category move: remove from sourceCatId, insert into destCatId at destIndex
        const sourceArr = itemsMap[sourceCatId] || [];
        const destArr = itemsMap[destCatId] || [];

        const removedIdx = sourceArr.findIndex(i => i._id === sourceItemId);
        const insertedIdx = destArr.findIndex(i => i._id === destItemId);

        if (removedIdx === -1 || insertedIdx === -1) return;

        // 1) Compute new arrays in memory:
        // → “take out” the moved item
        const movedItem = sourceArr[removedIdx];
        const newSourceArr = sourceArr
          .filter(i => i._id !== sourceItemId)
          .map((it, idx) => ({ ...it, position: idx }));
        // → “insert” into destArr at insertedIdx
        const newDestArr = [
          ...destArr.slice(0, insertedIdx),
          movedItem,
          ...destArr.slice(insertedIdx)
        ].map((it, idx) => ({
          ...it,
          position: idx,
          // If this is the movedItem, its category changes to destCatId
          category: it._id === movedItem._id ? destCatId : it.category
        }));

        // 2) Immediately update UI:
        setItemsMap(prev => ({
          ...prev,
          [sourceCatId]: newSourceArr,
          [destCatId]: newDestArr
        }));

        // 3) Persist to server in (multiple) PATCHes:
        //    a) Update moved item’s category AND new position in destCat
        await api.patch(
          `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
          { category: destCatId, position: newDestArr.find(i => i._id === sourceItemId).position }
        );
        //    b) Update the “position” of every other item in old category (newSourceArr)
        for (let i = 0; i < newSourceArr.length; i++) {
          const it = newSourceArr[i];
          const oldPos = sourceArr.find(x => x._id === it._id).position;
          if (oldPos !== i) {
            await api.patch(
              `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
        //    c) Update the “position” of every other item in new category (newDestArr),
        //       except the moved one (which we already patched above)
        for (let i = 0; i < newDestArr.length; i++) {
          const it = newDestArr[i];
          if (it._id === sourceItemId) continue;
          const oldPos = destArr.find(x => x._id === it._id).position;
          if (oldPos !== i) {
            await api.patch(
              `/lists/${listId}/categories/${destCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
      }
      return;
    }
  
// 3) ITEM DROPPED INTO AN EMPTY CATEGORY (optional):
    // If active.id startsWith('item-') but over.id is exactly equal to `cat-<someCatId>`,
    // then we know the user dropped it “into the empty space” of that category.
    // We then treat it as “insert at end of that category.”
    if (active.id.startsWith('item-') && over.id.startsWith('cat-')) {
      const [ , sourceCatId, sourceItemId ] = active.id.split('-');
      const destCatId = over.id.replace(/^cat-/, '');

      if (sourceCatId === destCatId) return; // nothing changed

      const sourceArr = itemsMap[sourceCatId] || [];
      const destArr = itemsMap[destCatId] || [];

      const removedIdx = sourceArr.findIndex(i => i._id === sourceItemId);
      if (removedIdx === -1) return;

      // “move to end of destArr”
      const movedItem = sourceArr[removedIdx];
      const newSourceArr = sourceArr
        .filter(i => i._id !== sourceItemId)
        .map((it, idx) => ({ ...it, position: idx }));
      const newDestArr = [
        ...destArr,
        movedItem
      ].map((it, idx) => ({
        ...it,
        position: idx,
        category: it._id === movedItem._id ? destCatId : it.category
      }));

      // Update UI immediately
      setItemsMap(prev => ({
        ...prev,
        [sourceCatId]: newSourceArr,
        [destCatId]: newDestArr
      }));

      // Persist changes to server
      // a) moved item’s category + new position
      await api.patch(
        `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
        { category: destCatId, position: newDestArr.length - 1 }
      );
      // b) re-index source category
      for (let i = 0; i < newSourceArr.length; i++) {
        const it = newSourceArr[i];
        const oldPos = sourceArr.find(x => x._id === it._id).position;
        if (oldPos !== i) {
          await api.patch(
            `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
            { position: i }
          );
        }
      }
      return;
    }
  };



  // ──────────────────────────────────────────────────────────────────────────
// We factored out the common JSX for a single category’s “section” (List mode)
// so that it now accepts an `items` prop (the array of gear items) and simply
// uses SortableContext + SortableItem inside. Everything else (inline edits,
// toggles, deletes, “Add Item” button) remains exactly the same. 
// Same goes for SortableColumn below.

// ───────────── SORTABLESECTION (LIST MODE) ─────────────
function SortableSection({
  category,
  items,
  editingCatId,
  setEditingCatId,
  onEditCat,
  onDeleteCat,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDeleteItem,
  showAddModalCat,
  setShowAddModalCat,
  fetchItems,
  listId
}) {
  const catId = category._id;
  const [localTitle, setLocalTitle] = useState(category.title);

  // useSortable for the category header itself:
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `cat-${catId}` });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="bg-sand/20 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center mb-3">
        <FaGripVertical {...attributes} {...listeners}
          className="mr-2 cursor-grab text-pine" />

        {editingCatId === catId ? (
          <input
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            className="flex-1 border border-pine rounded p-1 bg-white"
          />
        ) : (
          <h3 className="flex-1 font-semibold text-pine">
            {category.title}
          </h3>
        )}

        {editingCatId === catId ? (
          <>
            <button
              onClick={() => onEditCat(catId, localTitle)}
              className="text-teal mr-2"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCatId(null)}
              className="text-ember"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <FaEdit
              onClick={() => {
                setEditingCatId(catId);
                setLocalTitle(category.title);
              }}
              className="mr-2 cursor-pointer text-teal"
            />
            <FaTrash
              onClick={() => onDeleteCat(catId)}
              className="cursor-pointer text-ember"
            />
          </>
        )}
      </div>

      {/* ───── The NEW SortableContext wrapping this category’s items ───── */}
      <SortableContext
        items={items.map(i => `item-${catId}-${i._id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {items.map(item => (
            <SortableItem
              key={item._id}
              item={item}
              catId={catId}
              onToggleConsumable={onToggleConsumable}
              onToggleWorn={onToggleWorn}
              onQuantityChange={onQuantityChange}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      </SortableContext>
      {/* ──────────────────────────────────────────────────────────────── */}

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

// ───────────── SORTABLECOLUMN (COLUMN MODE) ─────────────
function SortableColumn({
  category,
  items,
  editingCatId,
  setEditingCatId,
  onEditCat,
  onDeleteCat,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDeleteItem,
  showAddModalCat,
  setShowAddModalCat,
  fetchItems,
  listId
}) {
  const catId = category._id;
  const [localTitle, setLocalTitle] = useState(category.title);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `cat-${catId}` });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="snap-center flex-shrink-0 m-2 w-80 sm:w-64 bg-sand/20 rounded-lg p-3 flex flex-col h-full"
    >
      <div className="flex items-center mb-2">
        <FaGripVertical {...attributes} {...listeners}
          className="mr-2 cursor-grab text-pine" />

        {editingCatId === catId ? (
          <input
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            className="flex-1 border border-pine rounded p-1 bg-white"
          />
        ) : (
          <h3 className="flex-1 font-semibold text-pine">
            {category.title}
          </h3>
        )}

        {editingCatId === catId ? (
          <>
            <button
              onClick={() => onEditCat(catId, localTitle)}
              className="text-teal mr-2"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCatId(null)}
              className="text-ember"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <FaEdit
              onClick={() => {
                setEditingCatId(catId);
                setLocalTitle(category.title);
              }}
              className="mr-2 cursor-pointer text-teal"
            />
            <FaTrash
              onClick={() => onDeleteCat(catId)}
              className="cursor-pointer text-ember"
            />
          </>
        )}
      </div>

      {/* ───── The NEW SortableContext wrapping this column’s items ───── */}
      <SortableContext
        items={items.map(i => `item-${catId}-${i._id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto space-y-2 mb-2">
          {items.map(item => (
            <SortableItem
              key={item._id}
              item={item}
              catId={catId}
              onToggleConsumable={onToggleConsumable}
              onToggleWorn={onToggleWorn}
              onQuantityChange={onQuantityChange}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      </SortableContext>
      {/* ──────────────────────────────────────────────────────────────── */}

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




  // // — Column mode —
  // function SortableColumn({ category }) {
  //   const { attributes, listeners, setNodeRef, transform, transition } =
  //     useSortable({ id: category._id });
  //   const style = { transform: CSS.Transform.toString(transform), transition };
  //   const catId = category._id;
  //   const [localTitle, setLocalTitle] = useState(category.title);

  //   return (
  //     <div
  //       ref={setNodeRef}
  //       style={style}
  //       className="snap-center flex-shrink-0 m-2 w-80 sm:w-64 bg-sand/20 rounded-lg p-3 flex flex-col h-full"
  //     >
  //       <div className="flex items-center mb-2">
  //         <FaGripVertical {...attributes} {...listeners}
  //           className="mr-2 cursor-grab text-pine" />

  //         {editingCatId === catId ? (
  //           <input
  //             value={localTitle}
  //             onChange={e => setLocalTitle(e.target.value)}
  //             className="flex-1 border border-pine rounded p-1 bg-white"
  //           />
  //         ) : (
  //           <h3 className="flex-1 font-semibold text-pine">
  //             {category.title}
  //           </h3>
  //         )}

  //         {editingCatId === catId ? (
  //           <>
  //             <button
  //               onClick={() => editCat(catId, localTitle)}
  //               className="text-teal mr-2"
  //             >
  //               ✓
  //             </button>
  //             <button
  //               onClick={() => setEditingCatId(null)}
  //               className="text-ember"
  //             >
  //               ×
  //             </button>
  //           </>
  //         ) : (
  //           <>
  //             <FaEdit
  //               onClick={() => {
  //                 setEditingCatId(catId);
  //                 setLocalTitle(category.title);
  //               }}
  //               className="mr-2 cursor-pointer text-teal"
  //             />
  //             <FaTrash
  //               onClick={() => deleteCat(catId)}
  //               className="cursor-pointer text-ember"
  //             />
  //           </>
  //         )}
  //       </div>

  //       <div className="flex-1 overflow-y-auto space-y-2 mb-2">
  //         {(itemsMap[catId] || []).map(item => (
  //           <div key={item._id} className="bg-white p-3 rounded shadow flex flex-col">
  //             <div className="flex-1">
  //               <div className="text-lg font-semibold text-gray-800">
  //                 {item.itemType || '—'}
  //               </div>
  //               <div className="text-sm text-gray-700 mt-1">
  //                 {item.brand && <span className="mr-1">{item.brand}</span>}
  //                 {item.name}
  //               </div>
  //             </div>
  //             <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
  //               <span>{item.weight != null ? `${item.weight}g` : ''}</span>
  //               <div className="flex items-center space-x-3">
  //                 <FaUtensils
  //                   onClick={() => toggleConsumable(catId, item._id)}
  //                   className={`cursor-pointer ${
  //                     item.consumable ? 'text-green-600' : 'opacity-30'
  //                   }`}
  //                 />
  //                 <FaTshirt
  //                   onClick={() => toggleWorn(catId, item._id)}
  //                   className={`cursor-pointer ${
  //                     item.worn ? 'text-blue-600' : 'opacity-30'
  //                   }`}
  //                 />
  //                 <select
  //                   value={item.quantity}
  //                   onChange={e =>
  //                     updateQuantity(catId, item._id, Number(e.target.value))
  //                   }
  //                   className="border rounded p-1"
  //                 >
  //                   {[...Array(10)].map((_, i) => (
  //                     <option key={i+1} value={i+1}>{i+1}</option>
  //                   ))}
  //                 </select>
  //                 <FaTrash
  //                   onClick={() => deleteItem(catId, item._id)}
  //                   className="cursor-pointer text-red-500"
  //                 />
  //               </div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>

  //       <button
  //         onClick={() => setShowAddModalCat(catId)}
  //         className="h-12 w-full border border-teal rounded flex items-center justify-center space-x-2 text-teal hover:bg-teal/10"
  //       >
  //         <FaPlus /><span className="text-xs">Add Item</span>
  //       </button>
  //       {showAddModalCat === catId && (
  //         <AddGearItemModal
  //           listId={listId}
  //           categoryId={catId}
  //           onClose={() => setShowAddModalCat(null)}
  //           onAdded={() => fetchItems(catId)}
  //         />
  //       )}
  //     </div>
  //   );
  // }

  // // — List mode —
  // function SortableSection({ category }) {
  //   const { attributes, listeners, setNodeRef, transform, transition } =
  //     useSortable({ id: category._id });
  //   const style = { transform: CSS.Transform.toString(transform), transition };
  //   const catId = category._id;
  //   const [localTitle, setLocalTitle] = useState(category.title);

  //   return (
  //     <section
  //       ref={setNodeRef}
  //       style={style}
  //       className="bg-sand/20 rounded-lg p-4 mb-6"
  //     >
  //       <div className="flex items-center mb-3">
  //         <FaGripVertical {...attributes} {...listeners}
  //           className="mr-2 cursor-grab text-pine" />

  //         {editingCatId === catId ? (
  //           <input
  //             value={localTitle}
  //             onChange={e => setLocalTitle(e.target.value)}
  //             className="flex-1 border border-pine rounded p-1 bg-white"
  //           />
  //         ) : (
  //           <h3 className="flex-1 font-semibold text-pine">
  //             {category.title}
  //           </h3>
  //         )}

  //         {editingCatId === catId ? (
  //           <>
  //             <button
  //               onClick={() => editCat(catId, localTitle)}
  //               className="text-teal mr-2"
  //             >
  //               ✓
  //             </button>
  //             <button
  //               onClick={() => setEditingCatId(null)}
  //               className="text-ember"
  //             >
  //               ×
  //             </button>
  //           </>
  //         ) : (
  //           <>
  //             <FaEdit
  //               onClick={() => {
  //                 setEditingCatId(catId);
  //                 setLocalTitle(category.title);
  //               }}
  //               className="mr-2 cursor-pointer text-teal"
  //             />
  //             <FaTrash
  //               onClick={() => deleteCat(catId)}
  //               className="cursor-pointer text-ember"
  //             />
  //           </>
  //         )}
  //       </div>

  //       {/* ← **items** */}
  //       {(itemsMap[catId] || []).map(item => (
  //         <div
  //           key={item._id}
  //           className="
  //             bg-white rounded shadow p-4 mb-2
  //             flex flex-col space-y-2
  //             md:flex-row md:justify-between md:space-y-0 md:items-center
  //           "
  //         >
  //           <div className="flex-1 flex flex-wrap items-center space-x-2">
  //             <span className="font-semibold">{item.itemType}</span>
  //             <span>{item.brand}</span>
  //             <span>{item.name}</span>
  //             <span className="hidden md:inline">— {item.description}</span>
  //           </div>
  //           <div className="flex items-center space-x-3">
  //             <span>{item.weight != null ? `${item.weight}g` : ''}</span>
  //             <FaUtensils
  //               onClick={() => toggleConsumable(catId, item._id)}
  //               className={`cursor-pointer ${
  //                 item.consumable ? 'text-green-600' : 'opacity-30'
  //               }`}
  //             />
  //             <FaTshirt
  //               onClick={() => toggleWorn(catId, item._id)}
  //               className={`cursor-pointer ${
  //                 item.worn ? 'text-blue-600' : 'opacity-30'
  //               }`}
  //             />
  //             {item.price != null && (
  //               item.link ? (
  //                 <a
  //                   href={item.link}
  //                   target="_blank"
  //                   rel="noopener noreferrer"
  //                   className="text-teal hover:underline"
  //                 >
  //                   ${item.price}
  //                 </a>
  //               ) : (
  //                 <span>${item.price}</span>
  //               )
  //             )}
  //             <select
  //               value={item.quantity}
  //               onChange={e =>
  //                 updateQuantity(catId, item._id, Number(e.target.value))
  //               }
  //               className="border rounded p-1"
  //             >
  //               {[...Array(10)].map((_, i) => (
  //                 <option key={i+1} value={i+1}>{i+1}</option>
  //               ))}
  //             </select>
  //             <FaTrash
  //               onClick={() => deleteItem(catId, item._id)}
  //               className="cursor-pointer text-ember"
  //             />
  //           </div>
  //         </div>
  //       ))}

  //       {/* ← Add Item button */}
  //       <button
  //         onClick={() => setShowAddModalCat(catId)}
  //         className="mt-2 px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
  //       >
  //         <FaPlus className="mr-2" /> Add Item
  //       </button>
  //       {showAddModalCat === catId && (
  //         <AddGearItemModal
  //           listId={listId}
  //           categoryId={catId}
  //           onClose={() => setShowAddModalCat(null)}
  //           onAdded={() => fetchItems(catId)}
  //         />
  //       )}
  //     </section>
  //   );
  // }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="pl-10 pt-4 text-2xl font-bold text-pine">{listName}</h2>
            {/* ───── Wrap everything in one DndContext ───── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
      {viewMode === 'list' ? (
          // ──── LIST MODE ────
          <SortableContext
            // Category‐level SortableContext, items = [ 'cat-<cat1Id>', 'cat-<cat2Id>', … ]
            items={categories.map(c => `cat-${c._id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {categories.map(cat => (
                <SortableSection
                  key={cat._id}
                  category={cat}
                  items={itemsMap[cat._id] || []}
                  editingCatId={editingCatId}
                  setEditingCatId={setEditingCatId}
                  onEditCat={editCat}
                  onDeleteCat={deleteCat}
                  onToggleConsumable={toggleConsumable}
                  onToggleWorn={toggleWorn}
                  onQuantityChange={updateQuantity}
                  onDeleteItem={deleteItem}
                  showAddModalCat={showAddModalCat}
                  setShowAddModalCat={setShowAddModalCat}
                  fetchItems={fetchItems}
                  listId={listId}
                />
              ))}

              {/* Add New Category button (unchanged) */}
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
        ) : (
          // ──── COLUMN MODE ────
          <SortableContext
            // Category‐level SortableContext for columns
            items={categories.map(c => `cat-${c._id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex-1 flex flex-nowrap overflow-x-auto px-4 py-2 snap-x snap-mandatory">
              {categories.map(cat => (
                <SortableColumn
                  key={cat._id}
                  category={cat}
                  items={itemsMap[cat._id] || []}
                  editingCatId={editingCatId}
                  setEditingCatId={setEditingCatId}
                  onEditCat={editCat}
                  onDeleteCat={deleteCat}
                  onToggleConsumable={toggleConsumable}
                  onToggleWorn={toggleWorn}
                  onQuantityChange={updateQuantity}
                  onDeleteItem={deleteItem}
                  showAddModalCat={showAddModalCat}
                  setShowAddModalCat={setShowAddModalCat}
                  fetchItems={fetchItems}
                  listId={listId}
                />
              ))}
              {/* Add New Category column (unchanged) */}
              <div className="snap-center flex-shrink-0 m-2 w-80 sm:w-64 flex flex-col h-full">
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
        )}
      </DndContext>
    </div>
  );
}