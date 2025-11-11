import React from "react";
export default function ImprintPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Imprint / Contact</h1>
      <p>
        <strong>Trade name:</strong> Tall Joe Hikes (eenmanszaak)
      </p>
      <p>
        <strong>KvK:</strong> 98785419
      </p>
      <p>
        <strong>Address:</strong> (to be updated when service address is active)
      </p>
      <p>
        <strong>Email:</strong>
        <a className="underline" href="mailto:support@treklist.co">
          support@treklist.co
        </a>
      </p>
    </main>
  );
}
