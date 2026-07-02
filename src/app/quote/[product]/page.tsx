import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";
import { getSchema, PRODUCT_SLUGS, type ProductSlug } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((product) => ({ product }));
}

// A simple cross-sell rotation for the thanks screen.
const CROSS_SELL: Record<ProductSlug, { label: string; href: string }> = {
  auto: { label: "Get a home quote too", href: "/quote/home" },
  home: { label: "Get an auto quote too", href: "/quote/auto" },
  commercial: { label: "Get a workers' comp quote", href: "/quote/workers-comp" },
  "workers-comp": { label: "Get a commercial quote", href: "/quote/commercial" },
  landlord: { label: "Get a home quote too", href: "/quote/home" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const schema = getSchema(product);
  return {
    title: schema ? `${schema.product} quote — K2B Insurance` : "Quote — K2B Insurance",
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  const schema = getSchema(product);
  if (!schema) notFound();

  const crossSell = CROSS_SELL[product as ProductSlug] ?? {
    label: "Back to all coverage",
    href: "/#products",
  };

  return <Wizard schema={schema} crossSell={crossSell} />;
}
