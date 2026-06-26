/**
 * Convert a snake_case identifier into a human-readable Title Case label,
 * e.g. "force_sensitive" -> "Force Sensitive". Used as a display-name fallback
 * when no localized string-table entry exists.
 */
export const humanizeId = (id: string): string => id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
