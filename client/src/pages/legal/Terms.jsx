import React from "react";
import LegalLayout from "../../components/LegalLayout";
import TermsContent from "../../components/legal/TermsContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function TermsPage() {
  usePageTitle("Terms of Use");

  return (
    <LegalLayout>
      <TermsContent />
    </LegalLayout>
  );
}
