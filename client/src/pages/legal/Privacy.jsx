import React from "react";
import LegalLayout from "../../components/LegalLayout";
import PrivacyContent from "../../components/legal/PrivacyContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function PrivacyPage() {
  usePageTitle("Privacy Policy");

  return (
    <LegalLayout>
      <PrivacyContent />
    </LegalLayout>
  );
}
