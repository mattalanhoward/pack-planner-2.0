// client/src/components/AffiliateDisclosureNotice.jsx
import React from "react";

export default function AffiliateDisclosureNotice({
  context = "private", // "private" | "public"
  className = "",
}) {
  const msg =
    context === "public" ? (
      <>
        <strong>Disclosure:</strong> This page includes affiliate links (EU &
        US). If you buy through a link,{" "}
        <strong>TrekList or the list owner</strong> may earn a commission at no
        extra cost to you.{" "}
        <strong>
          As an Amazon Associate, I earn from qualifying purchases.
        </strong>
      </>
    ) : (
      <>
        <strong>Disclosure:</strong> This page includes affiliate links (EU &
        US). If you buy through a link, <strong>TrekList</strong> may earn a
        commission at no extra cost to you.{" "}
        <strong>
          As an Amazon Associate, I earn from qualifying purchases.
        </strong>
      </>
    );

  return (
    <div
      className={
        "text-xs md:text-sm px-3 py-2 rounded bg-yellow-50 text-yellow-900 border border-yellow-200 " +
        className
      }
      role="note"
    >
      {msg}
    </div>
  );
}
