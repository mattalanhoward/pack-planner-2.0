// client/src/components/AffiliateGateLink.jsx
import React from "react";
import ReactDOM from "react-dom";

const DISCLOSURE_PATH = "/legal/affiliate-disclosure";
const REMEMBER_DAYS = 60;

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60 * 24);
}

function getAckKey(context) {
  return `affiliate_ack_v2_${context || "private"}`;
}

function useDisclosureGate(context = "private") {
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);

  React.useEffect(() => {
    setReady(true); // avoid SSR/portal hiccups
    const stored = localStorage.getItem(getAckKey(context));
    setAcknowledged(daysSince(stored) < REMEMBER_DAYS);
  }, [context]);

  function markAck() {
    localStorage.setItem(getAckKey(context), new Date().toISOString());
    setAcknowledged(true);
  }

  return { open, setOpen, ready, acknowledged, markAck };
}

function Modal({ titleId, onClose, onProceed, children }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // simple focus: move to first button on mount
  const firstBtnRef = React.useRef(null);
  React.useEffect(() => {
    firstBtnRef.current?.focus();
  }, []);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative m-2 sm:m-0 w-full max-w-md rounded-lg bg-white shadow-lg outline-none">
        <div className="px-4 py-3 border-b">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            Thanks for supporting TrekList!
          </h2>
        </div>
        <div className="px-4 py-3 text-sm text-gray-800">{children}</div>
        <div className="px-4 pt-1 pb-4 flex gap-2 justify-end">
          <button
            type="button"
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            ref={firstBtnRef}
            type="button"
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1"
            onClick={onProceed}
          >
            Continue to retailer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Props:
 * - href (string, required)
 * - context: "private" | "public" (changes wording)
 * - className, title, ariaLabel
 * - children: usually an icon
 */
export default function AffiliateGateLink({
  href,
  context = "private",
  className = "",
  title = "Open product page",
  ariaLabel = "Open product page (paid link)",
  children,
}) {
  const { open, setOpen, ready, acknowledged, markAck } =
    useDisclosureGate(context);

  if (!href) {
    return (
      <span
        className={`inline-flex h-5 w-5 align-middle opacity-0 ${className}`}
        aria-hidden
      />
    );
  }

  const text =
    context === "public" ? (
      <>
        TrekList is a free tool made possible through affiliate links. When you
        purchase gear using these links,{" "}
        <strong>TrekList or the list owner</strong> may earn a small commission
        — at no extra cost to you. Your support helps keep the project running
        and free for everyone. <br />
        <span className="inline-block mt-1">
          <strong>
            As an Amazon Associate, I earn from qualifying purchases.
          </strong>
        </span>{" "}
        <a
          className="underline"
          href={DISCLOSURE_PATH}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
        .
      </>
    ) : (
      <>
        TrekList is a free service supported by affiliate links. If you decide
        to buy something after clicking, <strong>TrekList</strong> may earn a
        small commission — at no extra cost to you. Every purchase helps support
        the project and future updates. <br />
        <span className="inline-block mt-1">
          <strong>
            As an Amazon Associate, I earn from qualifying purchases.
          </strong>
        </span>{" "}
        <a
          className="underline"
          href={DISCLOSURE_PATH}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
        .
      </>
    );

  const onClick = (e) => {
    e.preventDefault();
    if (acknowledged) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  };

  const proceed = () => {
    markAck();
    setOpen(false);
    // small delay to let modal unmount smoothly
    setTimeout(() => window.open(href, "_blank", "noopener,noreferrer"), 40);
  };

  const titleId = React.useId();

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center h-5 w-5 align-middle text-secondary hover:text-secondary/70 ${className}`}
      >
        {children}
      </button>

      {ready && open && (
        <Modal
          titleId={titleId}
          onClose={() => setOpen(false)}
          onProceed={proceed}
        >
          <p className="mb-2">{text}</p>
        </Modal>
      )}
    </>
  );
}
