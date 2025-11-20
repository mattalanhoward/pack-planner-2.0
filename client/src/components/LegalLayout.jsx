// src/components/LegalLayout.jsx
import React from "react";
import { Link } from "react-router-dom";
import FooterLegal from "./FooterLegal";

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* Simple header */}
      <header className="border-b border-base-300 bg-base-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <Link
              to="/"
              className="text-sm font-semibold tracking-tight hover:underline"
            >
              TrekList
            </Link>
            <span className="text-xs text-secondary">
              {title || "Legal information"}
            </span>
          </div>
          <Link
            to="/"
            className="text-xs rounded border border-base-300 px-3 py-1 hover:bg-base-200/60"
          >
            Back to home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">{children}</div>
      </main>

      {/* Reuse existing legal footer */}
      <FooterLegal />
    </div>
  );
}
