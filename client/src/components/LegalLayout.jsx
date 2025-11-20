// src/components/LegalLayout.jsx
import React from "react";
import PublicHeader from "./PublicHeader";
import FooterLegal from "./FooterLegal";

export default function LegalLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col">
      {/* Public header, solid variant, no section anchors */}
      <PublicHeader variant="solid" showSections={false} />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">{children}</div>
      </main>

      <FooterLegal variant="light" />
    </div>
  );
}
