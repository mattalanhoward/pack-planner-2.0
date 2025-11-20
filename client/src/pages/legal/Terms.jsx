// src/pages/legal/Terms.jsx
import React from "react";
import LegalLayout from "../../components/LegalLayout";
import TermsContent from "../../components/legal/TermsContent";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use">
      <TermsContent />
    </LegalLayout>
  );
}
