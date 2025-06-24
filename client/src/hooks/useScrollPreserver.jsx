import { useRef, useLayoutEffect } from "react";

/**
 * Keeps a ref’d scroll container locked to its last scrollTop
 * whenever `watch` changes.
 */
export function useScrollPreserver(watch) {
  const ref = useRef(null);
  const last = useRef(0);

  // record scrollTop as the user scrolls
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      last.current = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // when `watch` changes, restore scrollTop *before* paint
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = last.current;
  }, [watch]);

  return ref;
}
