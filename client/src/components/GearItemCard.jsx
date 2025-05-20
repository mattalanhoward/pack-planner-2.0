// src/components/GearItemCard.jsx
import React from 'react';
import { FaUtensils, FaTshirt, FaEdit } from 'react-icons/fa';

export default function GearItemCard({ item, onEdit }) {
  return (
    <div className="bg-white p-3 rounded shadow flex flex-col justify-between">
      {/* First row: Item Type */}
      <div className="text-base font-semibold text-gray-800">
        {item.itemType || '—'}
      </div>

      {/* Second row: Brand, Name */}
      <div className="text-sm font-medium text-gray-700 my-1">
        {item.brand && <span className="mr-1">{item.brand}</span>}
        {item.name}
      </div>

      {/* Third row: Weight, Consumable, Worn, Price link/text, Quantity, Edit */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        {/* Weight */}
        <span>{item.weight != null ? `${item.weight}g` : ''}</span>

        <div className="flex items-center space-x-2">
          {/* Consumable: utensils icon */}
          <FaUtensils
            title="Consumable"
            className={item.consumable ? 'text-green-600' : 'opacity-30'}
          />

          {/* Worn: t-shirt icon */}
          <FaTshirt
            title="Worn"
            className={item.worn ? 'text-blue-600' : 'opacity-30'}
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

          {/* Quantity */}
          <span>× {item.quantity}</span>

          {/* Edit icon */}
          <button onClick={() => onEdit(item)} className="hover:text-gray-800">
            <FaEdit title="Edit item" />
          </button>
        </div>
      </div>
    </div>
  );
}
