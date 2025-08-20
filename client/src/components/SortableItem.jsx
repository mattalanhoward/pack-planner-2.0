import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaGripVertical,
  FaUtensils,
  FaTshirt,
  FaTimes,
  FaEllipsisH,
} from "react-icons/fa";
import { useWeight } from "../hooks/useWeight";
import ResolvedAffiliateLink from "../components/ResolvedAffiliateLink";

export default function SortableItem({
  item,
  listId,
  catId,
  onToggleConsumable,
  onToggleWorn,
  onDelete,
  isListMode,
  fetchItems,
  onQuantityChange,
}) {
  const [wornLocal, setWornLocal] = useState(item.worn);
  const [consumableLocal, setConsumableLocal] = useState(item.consumable);
  const weightText = useWeight(item.weight);
  const itemKey = `item-${catId}-${item._id}`;
  // make sure useSortable() never comes back undefined
  const sortable =
    useSortable({
      id: itemKey,
      data: { catId, itemId: item._id },
    }) || {};

  const {
    attributes = {},
    listeners = {},
    setNodeRef = () => {},
    transform = null,
    transition = null,
  } = sortable;

  // → handleWornClick
  const handleWornClick = () => {
    const newWorn = !wornLocal;
    setWornLocal(newWorn);

    api
      .patch(`/dashboard/${listId}/categories/${catId}/items/${item._id}`, {
        worn: newWorn,
      })
      .catch((err) => {
        // rollback on error
        setWornLocal(!newWorn);
        fetchItems?.(catId);
        toast.error(err.message || "Failed to toggle worn");
      });

    // notify parent with new value
    onToggleWorn?.(catId, item._id, newWorn);
  };

  // → handleConsumableClick
  const handleConsumableClick = () => {
    const newConsumable = !consumableLocal;
    setConsumableLocal(newConsumable);

    api
      .patch(`/dashboard/${listId}/categories/${catId}/items/${item._id}`, {
        consumable: newConsumable,
      })
      .catch((err) => {
        // rollback on error
        setConsumableLocal(!newConsumable);
        fetchItems(catId);
        toast.error(err.message || "Failed to toggle consumable");
      });

    // notify parent with new value
    onToggleConsumable?.(catId, item._id, newConsumable);
  };

  function QuantityInline({
    qty,
    onChange,
    catId,
    listId,
    itemId,
    fetchItems,
  }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(qty);
    const [localQty, setLocalQty] = useState(qty);

    // keep local in sync if item prop changes
    useEffect(() => {
      setValue(qty);
      setLocalQty(qty);
    }, [qty]);

    // → commit inside QuantityInline
    const commit = () => {
      const n = parseInt(value, 10);

      // only proceed if the value is a valid positive integer
      if (!isNaN(n) && n > 0) {
        const newQty = n;

        // optimistically update local state & parent only if it really changed
        if (newQty !== localQty) {
          setLocalQty(newQty);
          onQuantityChange?.(catId, itemId, newQty);
        }

        // always try to persist, so that we can catch & roll back on error
        api
          .patch(`/dashboard/${listId}/categories/${catId}/items/${itemId}`, {
            quantity: newQty,
          })
          .catch((err) => {
            // rollback on error
            setLocalQty(qty);
            fetchItems(catId);
            toast.error(err.message || "Failed to update quantity");
          });
      }

      setEditing(false);
    };

    if (editing) {
      return (
        <input
          type="number"
          min="1"
          className="w-12 text-center border rounded p-1 bg-neutral"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
        />
      );
    }

    return (
      <span
        onClick={() => setEditing(true)}
        className="cursor-pointer select-none px-1"
        title="Click to edit quantity"
      >
        {localQty}
      </span>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // BUY BUTTON In CASE YOU WANT TO ADD ONE IT CAN BE WRAPPED THE SAME WAY.
  // <ResolvedAffiliateLink item={item} href={item.link} className="btn btn-secondary">
  //   View
  // </ResolvedAffiliateLink>
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-base-100 px-3 sm:px-1 py-2 rounded shadow mb-2"
    >
      {/* MOBILE LIST MODE AND COLUMN MODE: TWO ROWS */}
      <div className="sm:hidden grid grid-rows-[auto_auto] gap-y-1 gap-x-2 text-sm">
        {/* ROW 1 (spans both cols) */}
        <div className="row-start-1 col-span-2 flex items-center justify-between space-x-2 overflow-hidden">
          {/* Left side: type + brand/name */}
          <div className="flex items-center space-x-1 overflow-hidden">
            <div className="font-semibold text-primary flex-shrink-0">
              {item.itemType || "—"}
            </div>
            <div className="truncate text-primary flex-1 overflow-hidden">
              <>
                {item.brand && <span className="mr-1">{item.brand}</span>}
                {item.name}
              </>
            </div>
          </div>

          {/* Right side: Edit Item */}
          <a
            href="#"
            title="See details"
            className="text-secondary hover:text-secondary/50"
          >
            <FaEllipsisH />
          </a>
        </div>

        {/* ROW 2, COL 1: Weight & Price */}
        <div className="row-start-2 col-start-1 flex items-center space-x-2 text-primary">
          <span>{weightText}</span>
          {item.price != null &&
            (item.link ? (
              <ResolvedAffiliateLink
                item={item}
                href={item.link}
                className="inline-block text-primary"
                region="DE"
              >
                <span>€TTTT{item.price}</span>
              </ResolvedAffiliateLink>
            ) : (
              <span>€{item.price}</span>
            ))}
        </div>

        {/* ROW 2, COL 2: Toggles, Qty & Ellipses */}
        <div className="row-start-2 col-start-2 justify-self-end flex items-center space-x-4">
          <FaUtensils
            title="Toggle consumable"
            onClick={handleConsumableClick}
            className={`cursor-pointer ${
              consumableLocal ? "text-green-600" : "opacity-30"
            }`}
          />
          <FaTshirt
            title="Toggle worn"
            onClick={handleWornClick}
            className={`cursor-pointer ${
              wornLocal ? "text-blue-600" : "opacity-30"
            }`}
          />
          <QuantityInline
            qty={item.quantity}
            onChange={(n) => onQuantityChange(catId, item._id, n)}
            catId={catId}
            listId={listId}
            itemId={item._id}
            fetchItems={fetchItems}
          />
        </div>
      </div>

      {/* DESKTOP GRID */}
      {isListMode ? (
        /* DESKTOP LIST MODE 1 ROW*/
        <div className="hidden sm:grid grid-cols-[32px,96px,1fr,32px,32px,32px,32px,32px,32px,32px] gap-x-2 items-center text-sm">
          {/* 1) Drag-handle */}
          <div
            className="cursor-grab hide-on-touch justify-self-center text-secondary"
            {...attributes}
            {...listeners}
          >
            <FaGripVertical />
          </div>

          {/* 2) Item type */}
          <div className="font-semibold text-primary truncate">
            {item.itemType || "—"}
          </div>

          {/* 3) Name/link */}
          <div className="truncate text-primary">
            {item.link ? (
              <ResolvedAffiliateLink
                item={item}
                href={item.link}
                className="inline-block w-full text-primary"
              >
                {item.brand && <span className="mr-1">{item.brand}</span>}
                {item.name}
              </ResolvedAffiliateLink>
            ) : (
              <>
                {item.brand && <span className="mr-1">{item.brand}</span>}
                {item.name}
              </>
            )}
          </div>

          {/* 4) Weight */}
          <div className="text-primary justify-self-end">{weightText}</div>

          {/* 5) Consumable toggle */}
          <div className="justify-self-center">
            <FaUtensils
              title="Toggle consumable"
              onClick={handleConsumableClick}
              className={`cursor-pointer ${
                consumableLocal ? "text-green-600" : "opacity-30"
              }`}
            />
          </div>

          {/* 6) Worn toggle */}
          <div className="justify-self-center">
            <FaTshirt
              title="Toggle worn"
              onClick={handleWornClick}
              className={`cursor-pointer ${
                wornLocal ? "text-blue-600" : "opacity-30"
              }`}
            />
          </div>

          {/* 7) Quantity */}
          <div className="justify-self-center">
            <QuantityInline
              qty={item.quantity}
              onChange={(n) => onQuantityChange(catId, item._id, n)}
              catId={catId}
              listId={listId}
              itemId={item._id}
              fetchItems={fetchItems}
            />
          </div>

          {/* 8) Price */}
          <div className="text-primary justify-self-end">
            {item.price != null &&
              (item.link ? (
                <ResolvedAffiliateLink
                  item={item}
                  href={item.link}
                  className="inline-block text-primary"
                >
                  <span>€{item.price}</span>{" "}
                </ResolvedAffiliateLink>
              ) : (
                <span>€{item.price}</span>
              ))}
          </div>

          {/* 9) Ellipsis */}
          <div className="justify-self-center">
            <a
              href="#"
              title="See details"
              className="text-secondary hover:text-secondary/50"
            >
              <FaEllipsisH />
            </a>
          </div>

          {/* 10) Delete */}
          <div className="place-self-center">
            {" "}
            <button
              type="button"
              title="Delete item"
              aria-label="Delete item"
              data-testid="trash"
              onClick={() => onDelete(catId, item._id)}
              className="
                inline-flex items-center justify-center 
                h-6 w-6 
                text-secondary hover:text-secondary/80
                focus:outline-none 
                leading-none"
            >
              <FaTimes className="w-4 h-4 align-middle" />
            </button>
          </div>
        </div>
      ) : (
        /* DESKTOP COLUMN MODE 3 ROWS*/
        <div
          className="hidden sm:grid bg-base-100 px-2
                grid-rows-[auto_auto_auto]"
        >
          {/* Row 1: Drag - Type - Trash */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center">
            <div
              className="cursor-grab hide-on-touch text-secondary"
              {...attributes}
              {...listeners}
            >
              <FaGripVertical />
            </div>
            <div className="font-semibold text-primary px-2">
              {item.itemType || "—"}
            </div>
            <button
              type="button"
              title="Delete item"
              aria-label="Delete item"
              data-testid="trash"
              onClick={() => onDelete(catId, item._id)}
              className="inline-flex items-center justify-center text-secondary hover:text-secondary/50 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>

          {/* Row 2: Brand - Name */}
          <div className="grid grid-cols-[auto_1fr] items-center">
            {item.link ? (
              <ResolvedAffiliateLink
                item={item}
                href={item.link}
                className="inline-block w-full text-primary"
              >
                <span className="font-medium text-sm text-primary mr-1">
                  {item.brand}
                </span>
              </ResolvedAffiliateLink>
            ) : (
              <span className="font-medium text-sm text-primary mr-1">
                {item.brand}
              </span>
            )}

            <div className="truncate text-sm text-primary">
              {item.link ? (
                <ResolvedAffiliateLink
                  item={item}
                  href={item.link}
                  className="inline-block w-full text-primary"
                >
                  <span className="font-medium text-sm text-primary mr-1">
                    {item.name}
                  </span>
                </ResolvedAffiliateLink>
              ) : (
                item.name
              )}
            </div>
          </div>

          {/* Row 3: Weight·Price (left) — Utensils·Shirt·Qty·Ellipsis (right) */}
          <div className="grid grid-cols-[1fr_auto] items-center">
            {/* Left group */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-primary">{weightText}</span>
              {item.price != null &&
                (item.link ? (
                  <ResolvedAffiliateLink
                    item={item}
                    href={item.link}
                    className="text-sm text-primary"
                  >
                    <span className="font-medium text-sm text-primary mr-1">
                      {item.price}
                    </span>
                  </ResolvedAffiliateLink>
                ) : (
                  <span className="text-sm text-primary">€{item.price}</span>
                ))}
            </div>
            {/* Right group */}
            <div className="grid grid-cols-[16px_16px_auto_16px] items-center justify-end gap-x-3">
              {" "}
              <FaUtensils
                title="Toggle consumable"
                aria-label="Toggle consumable"
                data-testid="utensils"
                onClick={handleConsumableClick}
                className={`cursor-pointer ${
                  consumableLocal ? "text-green-600" : "opacity-30"
                }`}
              />
              <FaTshirt
                title="Toggle worn"
                aria-label="Toggle worn"
                data-testid="tshirt"
                onClick={handleWornClick}
                className={`cursor-pointer ${
                  wornLocal ? "text-blue-600" : "opacity-30"
                }`}
              />
              <QuantityInline
                qty={item.quantity}
                onChange={(n) => onQuantityChange(catId, item._id, n)}
                catId={catId}
                listId={listId}
                itemId={item._id}
                fetchItems={fetchItems}
              />
              <a
                href="#"
                title="See details"
                className="text-secondary hover:text-secondary/50"
              >
                <FaEllipsisH />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
