import React, { useRef, useLayoutEffect } from "react";

/**
 * Wraps a scroll container and restores its scrollTop
 * whenever `watch` changes.
 */
export function ScrollPreserver({ children, className, watch }) {
  const ref = useRef(null);
  const last = useRef(0);

  // track scrollTop as the user scrolls
  const onScroll = () => {
    if (ref.current) last.current = ref.current.scrollTop;
  };

  // when `watch` changes, restore scrollTop
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = last.current;
    }
  }, [watch]);

  return (
    <div ref={ref} onScroll={onScroll} className={className}>
      {children}
    </div>
  );
}
