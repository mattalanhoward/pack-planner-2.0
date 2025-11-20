// src/pages/legal/CookieSettings.jsx
import React from "react";
import LegalLayout from "../../components/LegalLayout";
import CookieSettingsContent from "../../components/legal/CookieSettingsContent";

export default function CookieSettingsPage() {
  return (
    <LegalLayout title="Cookie Settings">
      <CookieSettingsContent />
    </LegalLayout>
  );
}
