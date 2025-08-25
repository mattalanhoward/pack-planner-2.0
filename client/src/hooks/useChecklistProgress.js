// client/src/hooks/useChecklistProgress.js
import { useEffect, useMemo, useState } from "react";

/**
 * Local-only checklist state, keyed by user/list/revision.
 * Auto-resets when the key changes (e.g., list updatedAt or item count changes).
 */
export default function useChecklistProgress({
  userId = "anon",
  listId,
  revision,
}) {
  const storageKey = useMemo(
    () => `checklist:${userId}:${listId}:${revision || ""}`,
    [userId, listId, revision]
  );

  const [checked, setChecked] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // When the key changes, hydrate from storage (don't wipe user state)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {}
  }, [storageKey, checked]);

  const toggle = (id) => setChecked((m) => ({ ...m, [id]: !m[id] }));
  const reset = () => setChecked({});

  return { checked, toggle, reset, storageKey };
}
