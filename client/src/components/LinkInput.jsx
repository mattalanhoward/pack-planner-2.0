// src/components/LinkInput.jsx
import React, { useState } from "react";

export default function LinkInput({
  value,
  onChange,
  label = "Link",
  name = "link",
  placeholder = "example.com",
  required = false,
}) {
  const [error, setError] = useState("");

  // Called when the user leaves (blurs) the input, or right before form submit
  const normalizeAndValidate = () => {
    const raw = value.trim();
    if (!raw) {
      // If it’s empty and not required, clear any error
      setError("");
      return;
    }

    // 1) If it doesn’t start with http:// or https://, prepend https://
    let candidate = raw;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = "https://" + candidate;
    }

    // 2) Try the native URL constructor
    try {
      // This will throw if “candidate” is not a syntactically valid URL
      new URL(candidate);

      // If valid, clear error and propagate the normalized value
      setError("");
      onChange(candidate);
    } catch {
      setError("Please enter a valid URL or domain name.");
    }
  };

  // Called on each keystroke
  const handleChange = (e) => {
    if (error) setError("");
    onChange(e.target.value);
  };

  // Remove any leading http(s):// before rendering
  const displayPlaceholder = placeholder.replace(/^https?:\/\//i, "");

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs sm:text-sm font-medium text-pine mb-0.5"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        placeholder={displayPlaceholder}
        value={value}
        onChange={handleChange}
        onBlur={normalizeAndValidate}
        className={
          "mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm " +
          (error ? "border-ember" : "")
        }
      />

      {error && <p className="mt-1 text-ember text-xs">{error}</p>}
    </div>
  );
}
