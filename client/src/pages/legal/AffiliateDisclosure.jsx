import React from "react";
import LegalLayout from "../../components/LegalLayout";
import AffiliateDisclosureContent from "../../components/legal/AffiliateDisclosureContent";
import usePageTitle from "../../hooks/usePageTitle";

export default function AffiliateDisclosurePage() {
  usePageTitle("Affiliate Disclosure");

  return (
    <LegalLayout>
      <AffiliateDisclosureContent />
    </LegalLayout>
  );
}
