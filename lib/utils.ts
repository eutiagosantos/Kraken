import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_PALETTE = [
  "#7132f5",
  "#5741d8",
  "#149e61",
  "#026b3f",
  "#d97706",
  "#e53e3e",
  "#2563eb",
  "#db2777",
] as const;

/** Deterministic index 0..palette-1 from any string (e.g. account name). */
export function stringHashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarBgColorForName(name: string): string {
  return AVATAR_PALETTE[stringHashCode(name) % AVATAR_PALETTE.length];
}

export function avatarInitials(name: string, maxChars = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, maxChars).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
