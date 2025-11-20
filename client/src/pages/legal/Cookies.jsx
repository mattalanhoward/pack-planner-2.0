// src/pages/legal/Cookies.jsx
import React from "react";
import LegalLayout from "../../components/LegalLayout";
import CookiesContent from "../../components/legal/CookiesContent";

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy">
      <CookiesContent />
    </LegalLayout>
  );
}
