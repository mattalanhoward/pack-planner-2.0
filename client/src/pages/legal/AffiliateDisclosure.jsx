import React from "react";

export default function AffiliateDisclosurePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">
        Affiliate Disclosure & How TrekList Earns
      </h1>

      <p className="mb-3">
        TrekList is free to use and we don’t run ads. We fund the project with{" "}
        <strong>affiliate links</strong> to outdoor retailers. When you click a
        link and make a purchase, we may earn a commission —{" "}
        <strong>at no extra cost to you</strong>.
      </p>

      <p className="mb-3">
        <strong>Amazon Associates (EU/US):</strong>{" "}
        <em>As an Amazon Associate, I earn from qualifying purchases.</em> We
        follow Amazon’s program policies and do not send affiliate links by
        email.
      </p>

      <p className="mb-3">
        <strong>Independence:</strong> We don’t accept payment to feature
        products. Recommendations reflect our own views and experience.
      </p>

      <p className="mb-3">
        <strong>Pricing & availability:</strong> Retailer prices, stock, and
        discounts change frequently. Always check the final price and
        availability on the retailer’s website.
      </p>

      <p className="mb-3">
        <strong>Regions:</strong> For now, we place affiliate links for the{" "}
        <strong>European Union and the United States</strong>. Users elsewhere
        may see standard (non-affiliate) links or no links.
      </p>

      <p className="mb-3">
        <strong>Questions:</strong>{" "}
        <a className="underline" href="mailto:support@treklist.co">
          support@treklist.co
        </a>
        .
      </p>
    </main>
  );
}
