import React from "react";
import LegalLayout from "../../components/LegalLayout";
import CookiesContent from "../../components/legal/CookiesContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function CookiesPage() {
  usePageTitle("Cookie Policy");

  return (
    <LegalLayout>
      <CookiesContent />
    </LegalLayout>
  );
}
