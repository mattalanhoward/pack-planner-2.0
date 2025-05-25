// src/components/GearItemCard.jsx
import React from 'react';
import {
  FaUtensils,
  FaTshirt,
  FaTrash,
} from 'react-icons/fa';

export default function GearItemCard({
  item,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDelete,
}) {
  return (
    <div className="bg-sand p-3 rounded shadow flex flex-col justify-between">
      {/* First row: Item Type */}
      <div className="text-base font-semibold text-pine-800">
        {item.itemType || '—'}
      </div>

      {/* Second row: Brand, Name */}
      <div className="text-sm font-medium text-pine-700 my-1">
        {item.brand && <span className="mr-1">{item.brand}</span>}
        {item.name}
      </div>

      {/* Third row: Weight + inline toggles, price, qty, delete */}
      <div className="flex items-center justify-between text-sm text-pine-600 mt-3">
        {/* Weight */}
        <span>{item.weight != null ? `${item.weight}g` : ''}</span>

        <div className="flex items-center space-x-3">
          {/* Consumable toggle */}
          <FaUtensils
            title="Toggle consumable"
            onClick={() => onToggleConsumable(item._id)}
            className={`cursor-pointer ${
              item.consumable ? 'text-green-600' : 'opacity-30'
            }`}
          />

          {/* Worn toggle */}
          <FaTshirt
            title="Toggle worn"
            onClick={() => onToggleWorn(item._id)}
            className={`cursor-pointer ${
              item.worn ? 'text-blue-600' : 'opacity-30'
            }`}
          />

          {/* Price */}
          {item.price != null && (
            item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 no-underline"
              >
                ${item.price}
              </a>
            ) : (
              <span>${item.price}</span>
            )
          )}

          {/* Quantity selector */}
          <select
            value={item.quantity}
            onChange={e => onQuantityChange(item._id, Number(e.target.value))}
            className="border bg-sand border-pine rounded p-1"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i+1} value={i+1}>
                {i+1}
              </option>
            ))}
          </select>

          {/* Delete icon */}
          <button
            onClick={() => onDelete(item._id)}
            className="hover:text-ember/80 text-ember"
            title="Delete item"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}