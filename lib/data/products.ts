import "server-only";
import { cache } from "react";
import fallbackCatalog from "@/data/products.json";
import { publicImagePath } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type ProductRow = {
  id: string;
  image: string;
  name: string;
  rating: { stars: number; count: number };
  price_cents: number;
  keywords: string[] | null;
  type: string | null;
  size_chart_link: string | null;
};

type CatalogEntry = {
  id: string;
  image: string;
  name: string;
  rating: { stars: number; count: number };
  priceCents: number;
  keywords?: string[];
  type?: string;
  sizeChartLink?: string;
};

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    image: publicImagePath(row.image),
    name: row.name,
    rating: row.rating,
    priceCents: row.price_cents,
    keywords: row.keywords ?? [],
    type: row.type,
    sizeChartLink: row.size_chart_link ? publicImagePath(row.size_chart_link) : null,
  };
}

function fromCatalog(entry: CatalogEntry): Product {
  return {
    id: entry.id,
    image: publicImagePath(entry.image),
    name: entry.name,
    rating: entry.rating,
    priceCents: entry.priceCents,
    keywords: entry.keywords ?? [],
    type: entry.type ?? null,
    sizeChartLink: entry.sizeChartLink ? publicImagePath(entry.sizeChartLink) : null,
  };
}

// Reads the catalog from Supabase. Until the products table exists and is
// seeded, falls back to the copy bundled in data/products.json.
export const getProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, image, name, rating, price_cents, keywords, type, size_chart_link")
      .order("name");

    if (error) throw error;
    if (data?.length) return (data as ProductRow[]).map(fromRow);
  } catch (error) {
    console.warn(
      "Supabase catalog unavailable; using data/products.json:",
      (error as Error).message,
    );
  }

  return (fallbackCatalog as CatalogEntry[])
    .map(fromCatalog)
    .sort((a, b) => a.name.localeCompare(b.name));
});
