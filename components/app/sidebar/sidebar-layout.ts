/** Inset from viewport edge when sidebar is “floating” (md+). */
export const SIDEBAR_FLOAT_INSET_PX = 12;
export const SIDEBAR_WIDTH_EXPANDED_PX = 260;
export const SIDEBAR_WIDTH_COLLAPSED_PX = 68;

/** Tailwind arbitrary margin classes — literals required for JIT; keep in sync with inset + widths. */
export function sidebarMainMarginTwClass(collapsed: boolean, ready: boolean): string {
  if (!ready || !collapsed) return "md:ml-[284px]";
  return "md:ml-[92px]";
}
