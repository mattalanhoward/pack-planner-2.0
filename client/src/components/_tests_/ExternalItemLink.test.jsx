import React from "react";
import { render, screen } from "@testing-library/react";
import ExternalItemLink from "../ExternalItemLink";

// Mock ResolvedAffiliateLink so we can assert the wrapper chose it
jest.mock("../ResolvedAffiliateLink", () => {
  // eslint-disable-next-line react/display-name
  return (props) => (
    <a data-testid="resolved-link" className={props.className}>
      {props.children}
    </a>
  );
});

describe("ExternalItemLink", () => {
  it("renders a plain anchor for non-affiliate items", () => {
    const item = {
      name: "Plain Tent",
      link: "https://example.com/tent",
      // no item.affliate.* present
    };

    render(
      <ExternalItemLink item={item} className="btn">
        Buy
      </ExternalItemLink>
    );

    const a = screen.getByRole("link", { name: /buy/i });
    expect(a).toHaveClass("btn");
    // JSDOM normalizes to absolute, so just check it ends with our URL
    expect(a.getAttribute("href")).toContain("https://example.com/tent");
    expect(screen.queryByTestId("resolved-link")).toBeNull(); // didn't use resolver
  });

  it("uses ResolvedAffiliateLink for affiliate-backed items", () => {
    const item = {
      name: "Awin Backpack",
      link: "https://example.com/aw",
      affiliate: { network: "awin", itemGroupId: "GROUP-1" },
    };

    render(
      <ExternalItemLink item={item} className="btn">
        Buy
      </ExternalItemLink>
    );

    // Our mock returns an anchor with data-testid
    const a = screen.getByTestId("resolved-link");
    expect(a).toBeInTheDocument();
    expect(a).toHaveClass("btn");
    // We don't assert href here because ResolvedAffiliateLink resolves async.
    // The presence of the mocked component is enough to prove the branch.
  });
});
