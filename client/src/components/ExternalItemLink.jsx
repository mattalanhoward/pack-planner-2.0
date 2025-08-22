// ExternalItemLink.jsx
// Drop-in wrapper: uses ResolvedAffiliateLink for affiliate-backed items,
// falls back to a plain anchor for normal items.
// Usage:
//   <ExternalItemLink item={item} className="btn">Buy</ExternalItemLink>
//   <ExternalItemLink href={linkFromElsewhere}>View</ExternalItemLink>

import React from "react";
import ResolvedAffiliateLink from "./ResolvedAffiliateLink";

export default function ExternalItemLink({
  item,
  href,
  children,
  className,
  region, // optional override (e.g. "DE") for QA; otherwise viewer locale is used
  ...rest
}) {
  const candidateHref = href || item?.link || "#";
  const isAffiliate = !!item?.affiliate?.network; // e.g. "awin"

  if (isAffiliate) {
    return (
      <ResolvedAffiliateLink
        item={item}
        href={candidateHref}
        region={region}
        className={className}
        {...rest}
      >
        {children}
      </ResolvedAffiliateLink>
    );
  }

  // Non-affiliate / plain link
  return (
    <a
      href={candidateHref}
      className={className}
      rel="nofollow noopener noreferrer"
      target="_blank"
      {...rest}
    >
      {children}
    </a>
  );
}
