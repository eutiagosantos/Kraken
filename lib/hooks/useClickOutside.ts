"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls handler when a pointer event occurs outside `ref` (and outside optional `ignoreRefs`).
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
  ignoreRefs: Array<RefObject<HTMLElement | null>> = []
) {
  const ignoreRefsLatest = useRef(ignoreRefs);
  ignoreRefsLatest.current = ignoreRefs;

  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      const target = e.target as Node | null;
      if (!el || !target) return;
      if (el.contains(target)) return;
      for (const r of ignoreRefsLatest.current) {
        if (r.current?.contains(target)) return;
      }
      handler();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [ref, handler, enabled]);
}
