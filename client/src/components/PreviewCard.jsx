import React from "react";
import { FaUtensils, FaTshirt, FaTrash } from "react-icons/fa";

export default function PreviewCard({ item }) {
  return (
    <div
      style={{
        width: "16rem", // roughly the same as your card width (w-64 ≈ 16rem)
        padding: "0.75rem", // p-3
        backgroundColor: "white",
        borderRadius: "0.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Top row: itemType */}
      <div
        style={{
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#2d3748",
          marginBottom: "0.25rem",
        }}
      >
        {item.itemType || "—"}
      </div>

      {/* Brand + name */}
      <div style={{ fontSize: "0.875rem", color: "#4a5568" }}>
        {item.brand && (
          <span style={{ marginRight: "0.25rem" }}>{item.brand}</span>
        )}
        {item.name}
      </div>

      {/* Bottom row: weight + icons + price + qty + delete */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.75rem",
          fontSize: "0.875rem",
          color: "#4a5568",
        }}
      >
        <span>{item.weight != null ? `${item.weight}g` : ""}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <FaUtensils
            style={{ opacity: item.consumable ? 1 : 0.3, cursor: "default" }}
            title="Consumable?"
          />
          <FaTshirt
            style={{ opacity: item.worn ? 1 : 0.3, cursor: "default" }}
            title="Worn?"
          />
          {item.price != null &&
            (item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#319795", textDecoration: "none" }}
              >
                ${item.price}
              </a>
            ) : (
              <span>${item.price}</span>
            ))}
          <span
            style={{
              padding: "0.25rem",
              border: "1px solid #cbd5e0",
              borderRadius: "0.25rem",
            }}
          >
            {item.quantity}
          </span>
          <FaTrash style={{ color: "#e53e3e" }} />
        </div>
      </div>
    </div>
  );
}
