// Product + status metadata shared by the wizard, portal, and CSV export.
// Colors mirror the design reference's productMeta() / STATUSES maps exactly.

import { PRODUCT_SCHEMAS, type ProductSchema } from "./quote-schemas";

export type ProductSlug = keyof typeof PRODUCT_SCHEMAS;

export const PRODUCT_SLUGS = Object.keys(PRODUCT_SCHEMAS) as ProductSlug[];

export function getSchema(slug: string): ProductSchema | null {
  return (PRODUCT_SCHEMAS as Record<string, ProductSchema>)[slug] ?? null;
}

/** Map the stored product label (e.g. "Workers' Comp") back to its slug. */
export function slugForProduct(product: string): ProductSlug | null {
  const entry = (Object.entries(PRODUCT_SCHEMAS) as [ProductSlug, ProductSchema][]).find(
    ([, s]) => s.product === product,
  );
  return entry ? entry[0] : null;
}

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Quoted",
  "Bound",
  "Closed",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// fg/bg for the status selector + badge, verbatim from the design reference.
export const STATUS_COLORS: Record<LeadStatus, { fg: string; bg: string }> = {
  New: { fg: "var(--blue-600)", bg: "var(--blue-50)" },
  Contacted: { fg: "var(--amber-600)", bg: "var(--amber-50)" },
  Quoted: { fg: "var(--blue-700)", bg: "var(--blue-100)" },
  Bound: { fg: "var(--green-600)", bg: "var(--green-50)" },
  Closed: { fg: "var(--ink-600)", bg: "var(--ink-100)" },
};

// Per-product pill colors, verbatim from the design reference's productMeta().
export const PRODUCT_COLORS: Record<string, { fg: string; bg: string }> = {
  Auto: { fg: "var(--blue-700)", bg: "var(--blue-50)" },
  Home: { fg: "var(--green-700)", bg: "var(--green-50)" },
  Commercial: { fg: "var(--amber-700)", bg: "var(--amber-50)" },
  "Workers' Comp": { fg: "oklch(0.45 0.14 285)", bg: "oklch(0.96 0.03 285)" },
  Landlord: { fg: "oklch(0.44 0.09 200)", bg: "oklch(0.96 0.03 200)" },
};

export function productColor(product: string) {
  return PRODUCT_COLORS[product] ?? { fg: "var(--ink-700)", bg: "var(--ink-100)" };
}

// The public filter pills in the portal.
export const PRODUCT_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Auto", label: "Auto" },
  { value: "Home", label: "Home" },
  { value: "Commercial", label: "Commercial" },
  { value: "Workers' Comp", label: "Workers' Comp" },
  { value: "Landlord", label: "Landlord" },
];
