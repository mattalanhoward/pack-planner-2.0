import React from "react";
import LegalLayout from "../../components/LegalLayout";
import ImprintContent from "../../components/legal/ImprintContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function ImprintPage() {
  usePageTitle("Imprint & Contact");

  return (
    <LegalLayout>
      <ImprintContent />
    </LegalLayout>
  );
}
