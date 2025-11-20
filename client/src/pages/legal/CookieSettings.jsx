import React from "react";
import LegalLayout from "../../components/LegalLayout";
import CookieSettingsContent from "../../components/legal/CookieSettingsContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function CookieSettingsPage() {
  usePageTitle("Cookie Settings");

  return (
    <LegalLayout>
      <CookieSettingsContent />
    </LegalLayout>
  );
}
