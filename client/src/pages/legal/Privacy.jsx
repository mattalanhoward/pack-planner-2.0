// src/pages/legal/Privacy.jsx
import React from "react";
import LegalLayout from "../../components/LegalLayout";
import PrivacyContent from "../../components/legal/PrivacyContent";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <PrivacyContent />
    </LegalLayout>
  );
}
